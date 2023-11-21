import { ipcMain } from 'electron';
import { Client } from "minecraft-launcher-core";
import fs from 'fs-extra';
import axios from 'axios';
import path from 'path';
import AdmZip from 'adm-zip';
import ChildProcess from 'child_process';
import {token} from './ipc'
import {updateText, updateProgress, mainWindow} from './main'
import {store} from './main'

import * as config from './utils/config';
config.loadConfig();


const sysRoot = process.env.APPDATA || (process.platform == "darwin"
    ? process.env.HOME + "/Library/Application Support"
    : process.env.HOME) as string;

let jre = 'default'
let gameConfig: any;


export const initGame = () => {
    ipcMain.on('launch', (evt, d) => {
        if (!fs.existsSync(path.join(sysRoot, '.JFLauncher', d.channel))) {
            fs.mkdirSync(path.join(sysRoot, '.JFLauncher', d.channel), { recursive: true });
        }
    
        gameConfig = {
            ram: d.ram,
        }
        checkModpack(d.channel)
            .then(() => {})
            .catch(() => console.log('Modpack not found'))
        
        checkJavaInstall(d.channel)
            .then(() => {
                launch(d.channel)
            })
            .catch(() => {
                const jrePath = path.join(config.getGamePath(d.channel), 'jre');
                if (!fs.existsSync(jrePath)) {
                    fs.mkdirSync(jrePath, { recursive: true });
                }
                if (process.platform === 'linux') {
                    downloadJava(config.jreLinux, path.join(jrePath, 'jre-linux.zip'), jrePath, d.channel);
                }
                else {
                    downloadJava(config.jreWin, path.join(jrePath, 'jre-windows.zip'), jrePath, d.channel);
                }
            })
    })
}

function checkJavaInstall(channel: string) {
    return new Promise<void>((resolve, reject) => {
        const jrePath = path.join(config.getGamePath(channel), 'jre');
        let jreIntallFiles = path.join(jrePath, 'jre-windows.zip');

        updateText('Vérification de Java');
        
        if (process.platform === 'linux') {
            jreIntallFiles = path.join(jrePath, 'jre-linux.zip');
        }

        if (fs.existsSync(jrePath) && fs.readdirSync(jrePath).length > 0 && !fs.existsSync(jreIntallFiles)) {
            jre = jrePath;
            return resolve();
        }
        
        if (fs.existsSync(jreIntallFiles)) {
            fs.unlinkSync(jreIntallFiles);
            return reject();
        }

        const spawn = ChildProcess.spawn('java', ['-version']);
        spawn.on('error', (err) => {
            console.error(err);
            return reject();
        });
        spawn.stderr.on('data', (data) => {
            if (data.includes('version') && data.includes('1.8')) {
                data = data.toString().split('\n')[0]
                const javaVersion = new RegExp("java version").test(data) ? data.split(' ')[2].replace(/"/g, '') : false;
                if (javaVersion) {
                    jre = 'default';
                    return resolve();
                }
                else {
                    if (fs.existsSync(jrePath) && fs.readdirSync(jrePath).length !== 0) {
                        jre = jrePath;
                        return resolve();
                    }
                    else {
                        return reject();
                    }
                }
            }
            else {
                if (fs.existsSync(jrePath) && fs.readdirSync(jrePath).length !== 0) {
                    jre = jrePath;
                    return resolve();
                } else {
                    return reject();
                }
            }
        });
    })
}

async function downloadJava(url: string, target: string, jrePath: string, channel: string) {
    try {
        updateText('Téléchargement de Java')
        axios({
            url: url, 
            method: 'GET', 
            responseType: 'arraybuffer',
            onDownloadProgress: (progressEvent) => {
                const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                console.log(`Progression: ${progress}%`);
                updateProgress(progress);
            }
        })
            .then(async (res) => {                
                const buffer = Buffer.from(res.data, 'binary');
                await fs.writeFileSync(target, buffer);

                if (fs.statSync(target).size === parseInt(res.headers['content-length'])) {
                    updateText('Extraction de Java')
                    const zip = new AdmZip(target);
                    zip.extractAllTo(jrePath, true);
                    fs.unlinkSync(target);
                    jre = jrePath;
                    launch(channel)
                }
            })
            .catch((err) => {
                console.error(err);
            })
    }
    catch (err) {
        console.error(err);
    }
}

function checkModpack(channel: string) {
    return new Promise<void>(async (resolve, reject) => {
        const modpackPath = path.join(config.getGamePath(channel), `JF-${channel}.zip`);
        const data = store.get("config")
        
        if (fs.existsSync(modpackPath)) {
            return resolve();
        }
        else {
            return reject();
        }
    })


}

function launch(channel: string) {
    const launcher = new Client();

    const javaPath = jre && jre !== "default" ? path.join(jre, "bin", process.platform === "win32" ? "java.exe" : "java" ) : undefined;

    let opts = {
        // Simply call this function to convert the msmc minecraft object into a mclc authorization object
        authorization: token.mclc(),
        root: config.getGamePath(channel),
        clientPackage : `https://nas.team-project.fr/api/public/dl/qhdPbmWq/JimmuFactory/JF-${channel}.zip`,
        removePackage: true,
        forge: path.join(config.getGamePath(channel), 'forge.jar'),
        javaPath: javaPath,
        version: {
            number: "1.20.1",
            type: "release"
        },
        memory: {
            max: `${gameConfig.ram}G`,
            min:'1G'
        }
    };
    launcher.launch(opts);

    // launcher.on('debug', (e) => console.log('debug',e));
    launcher.on('arguments', (e) => {
        mainWindow.hide()
    });

    launcher.on('progress', (e) => {
        updateText(`Chargement de ${e.type}`);
        updateProgress(parseInt((100.0*e.task/e.total).toFixed(0)));
    });

    launcher.on('download-status', (e) => {
        updateText(`Téléchargement de ${e.type}`);
        updateProgress(Math.round(e.current/e.total*100));
    });

    launcher.on('close', (e) => {
        mainWindow.show()
        mainWindow.webContents.send("closed", '');
    });
}