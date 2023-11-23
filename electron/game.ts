import { ipcMain } from 'electron';
import { Client } from "minecraft-launcher-core";
import fs from 'fs-extra';
import axios, { AxiosRequestConfig } from 'axios';
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


export const initGame =  () => {
    ipcMain.on('launch', (evt, d) => {
        if (!fs.existsSync(path.join(sysRoot, '.JFLauncher', d.channel))) {
            fs.mkdirSync(path.join(sysRoot, '.JFLauncher', d.channel), { recursive: true });
        }
    
        gameConfig = {
            ram: d.ram,
        }
        
        checkJavaInstall(d.channel)
            .catch(() => {
                const jrePath = path.join(config.getGamePath(d.channel), 'jre');
                if (!fs.existsSync(jrePath)) {
                    fs.mkdirSync(jrePath, { recursive: true });
                }
                if (process.platform === 'linux') {
                    downloadJava(config.jreLinux, path.join(jrePath, 'jre-linux.zip'), jrePath, d.channel)
                        .then(() => {
                            updatePackAndLaunch(d.channel)
                        })
                        .catch(() => {
                            console.error('Erreur lors du téléchargement de java');
                        })
                }
                else {
                    downloadJava(config.jreWin, path.join(jrePath, 'jre-windows.zip'), jrePath, d.channel)
                        .then(() => {
                            updatePackAndLaunch(d.channel)
                        })
                        .catch(() => {
                            console.error('Erreur lors du téléchargement de java');
                        })
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

function downloadJava(url: string, target: string, jrePath: string, channel: string) {
    return new Promise<void>(async (resolve, reject) => {
        try {
            updateText('Téléchargement de Java')
            axios.get(url, {responseType: 'stream'})
                .then(async (res) => {
                    const writer = fs.createWriteStream(target);
                    const totalSize = parseInt(res.headers['content-length'], 10);
                    let downloadedSize = 0
    
                    res.data.on('data', (chunk: any) => {
                        downloadedSize += chunk.length;
                        const progress = Math.round((downloadedSize / totalSize) * 100)
                        updateText(`Téléchargement de java`);
                        updateProgress(progress);
                    })

                    res.data.pipe(writer);
                    writer.on('finish', () => {
                        updateText('Extraction de Java')
                        const zip = new AdmZip(target);
                        zip.extractAllTo(jrePath, true);
                        fs.unlinkSync(target);
                        jre = jrePath;
                        resolve()
                    })
    
                    writer.on('error', (err) => {
                        console.error(err);
                        return reject();
                    })
                })
                .catch((err) => {
                    console.error(err);
                    return reject();
                })
        }
        catch (err) {
            console.error(err);
            return reject();
        }
    })
}

function updatePackAndLaunch(channel: string) {
    downloadForge(channel)
        .then(() => {
            downloadModpack(channel)
                .then(() => launch(channel))
                .catch(() => {
                    console.error('Erreur lors du téléchargement du modpack');
                })
        
        })
        .catch(() => {
            console.error('Erreur lors du téléchargement de forge');
        })
}

function downloadForge(channel: string) {
    return new Promise<void>((resolve, reject) => {
        const data = config.getGameChannel(channel)
        const forgePath = path.join(config.getGamePath(channel), `forge-${data?.mc_version}-${data?.current_forge_version}-installer.jar`);

        updateText('Vérification de forge')

        if (fs.existsSync(forgePath) && data?.current_forge_version) {
            return resolve();
        }
        else {
            if (fs.existsSync(forgePath)) {
                fs.unlinkSync(forgePath);
            }
            updateText('Téléchargement de forge')

            const forgeLink = config.forgeBaseLink.replace(/%mc/g, data?.mc_version as string).replace(/%fo/g, data?.current_forge_version as string)

            axios.get(forgeLink, {responseType: 'stream'})
                .then((res) => {

                    const writer = fs.createWriteStream(forgePath);
                    const totalSize = parseInt(res.headers['content-length'], 10);
                    let downloadedSize = 0

                    res.data.on('data', (chunk: any) => {
                        downloadedSize += chunk.length;
                        const progress = Math.round((downloadedSize / totalSize) * 100)
                        updateText(`Téléchargement de forge`);
                        updateProgress(progress);
                    })

                    res.data.pipe(writer);

                    writer.on('finish', () => {
                        return resolve();
                    })
                    writer.on('error', (err) => {
                        console.error(err);
                        return reject();
                    })
                })
                .catch((err) => {
                    console.error(err);
                    return reject();
                })
        }
    })

}

function downloadModpack(channel: string) {
    return new Promise<void>(async (resolve, reject) => {
        const data = config.getGameChannel(channel)
        const modpackPath = path.join(config.getGamePath(channel), `JF-${channel}.zip`);
        const lastChannelData = store.get('currentChannelVersion') as {channel: string, version: string}

        updateText('Vérification du modpack')
        if (lastChannelData && lastChannelData.version === data?.current_pack_version) {
            return resolve();
        }
        else {
            if (fs.existsSync(modpackPath)) {
                fs.unlinkSync(modpackPath);
            }
            updateText('Téléchargement du modpack')

            axios.get(data?.download_link as string, {responseType: 'stream'})
                .then((res) => {

                    const writer = fs.createWriteStream(modpackPath);
                    const totalSize = parseInt(res.headers['content-length'], 10);
                    let downloadedSize = 0

                    res.data.on('data', (chunk: any) => {
                        downloadedSize += chunk.length;
                        const progress = Math.round((downloadedSize / totalSize) * 100)
                        updateText(`Téléchargement du modpack`);
                        updateProgress(progress);
                    })

                    res.data.pipe(writer);

                    writer.on('finish', () => {
                        updateText('Extraction du modpack')
                        const zip = new AdmZip(modpackPath);
                        zip.extractAllTo(config.getGamePath(channel), true);
                        fs.unlinkSync(modpackPath);
                        return resolve();
                    })
                    writer.on('error', (err) => {
                        console.error(err);
                        return reject();
                    })
                })
                .catch((err) => {
                    console.error(err);
                    return reject();
                })
        }
    })
}

function launch(channel: string) {
    const launcher = new Client();

    const javaPath = jre && jre !== "default" ? path.join(jre, "bin", process.platform === "win32" ? "java.exe" : "java" ) : undefined;

    const channelConfig = config.getGameChannel(channel);

    let opts = {
        // Simply call this function to convert the msmc minecraft object into a mclc authorization object
        authorization: token.mclc(),
        root: config.getGamePath(channel),
        clientPackage : undefined,//channelConfig?.download_link,//`https://nas.team-project.fr/api/public/dl/qhdPbmWq/JimmuFactory/JF-${channel}.zip`,
        removePackage: true,
        forge: path.join(config.getGamePath(channel), `forge-${channelConfig?.mc_version}-${channelConfig?.current_forge_version}-installer.jar`),
        javaPath: javaPath,
        version: {
            number: channelConfig?.mc_version as string,
            type: "release"
        },
        memory: {
            max: `${gameConfig.ram}G`,
            min:'1G'
        }
    };

    store.set('currentChannelVersion', {channel: channel, version: channelConfig?.current_pack_version})

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