import { ipcMain } from 'electron';
import { Client } from "minecraft-launcher-core";
import fs from 'fs-extra';
import axios from 'axios';
import path from 'path';
const onezip = require('onezip');
import {token} from './ipc'
import {updateText, updateProgress, mainWindow} from './main'
import {store} from './main'

import * as config from './utils/config';

const sysRoot = process.env.APPDATA || (process.platform == "darwin"
    ? process.env.HOME + "/Library/Application Support"
    : process.env.HOME) as string;

let jre = 'default'
let gameConfig: any;

type Progress = { type: string; task: number; total: number };

export const initGame =  () => {
    config.loadConfig();
    ipcMain.on('launch', (evt, d) => {
        if (!fs.existsSync(path.join(sysRoot, '.JFLauncher', d.channel))) {
            fs.mkdirSync(path.join(sysRoot, '.JFLauncher', d.channel), { recursive: true });
        }
    
        gameConfig = {
            ram: d.ram,
        }

        checkJavaInstall(d.channel)
            .then(() => updatePackAndLaunch(d.channel))
            .catch(() => {
                const jrePath = config.jrePath
                if (!fs.existsSync(jrePath)) {
                    fs.mkdirSync(jrePath, { recursive: true });
                }
                if (process.platform === 'linux') {
                    downloadJava(config.jreLinux, path.join(jrePath, 'jdk-linux.tar.gz'), jrePath)
                        .then(() => {
                            updatePackAndLaunch(d.channel)
                        })
                        .catch(() => {
                            console.error('Erreur lors du téléchargement de java');
                        })
                }
                else {
                    downloadJava(config.jreWin, path.join(jrePath, 'jdk-windows.zip'), jrePath)
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
        const jrePath = config.jrePath;
        let jreIntallFiles = path.join(jrePath, 'jdk-windows.zip');

        updateText('Vérification de Java');
        
        if (process.platform === 'linux') {
            jreIntallFiles = path.join(jrePath, 'jdk-linux.zip');
        }

        if (fs.existsSync(jrePath) && fs.readdirSync(jrePath).length > 0 && !fs.existsSync(jreIntallFiles)) {
            jre = jrePath;
            return resolve();
        }
        
        if (fs.existsSync(jreIntallFiles)) {
            fs.unlinkSync(jreIntallFiles);
            return reject();
        }
        else {
            return reject();
        }
    })
}

function downloadJava(url: string, target: string, jrePath: string) {
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
                        const extract = onezip.extract(target, jrePath)
                        extract.on('start', ()=> {
                            updateText(`Extraction de java`);
                        })
                        extract.on('progress', (percent: any) => {
                            updateText(`Extraction de java`);
                            updateProgress(percent);
                        })
                        extract.on('error', (error: any) => {
                            console.error(error);
                        });
                        
                        extract.on('end', () => {
                            fs.unlinkSync(target);
                            jre = jrePath;
                            return resolve()
                        });
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
                .then(() => {
                    launch(channel)
                })
                .catch((err) => {
                    console.error('Erreur lors du téléchargement du modpack', err);
                })
        
        })
        .catch(() => {
            console.error('Erreur lors du téléchargement de forge');
        })
}

function downloadForge(channel: string) {
    return new Promise<void>((resolve, reject) => {
        const data = config.getGameChannel(channel)
        const forgePath = path.join(config.forgePath, `forge-${data?.mc_version}-${data?.current_forge_version}-installer.jar`);

        updateText('Vérification de forge')

        if (!fs.existsSync(config.forgePath)) {
            fs.mkdirSync(config.forgePath, { recursive: true });
        }

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
        const lastChannels: any = store.get('currentChannelVersion')
        const lastChannelData = lastChannels?.find((c: any) => c.channel === channel)
        updateText('Vérification du modpack')

        if (lastChannelData && lastChannelData.version === data?.current_pack_version) {
            for(let i = 0; i < lastChannels.length; i++) {
                if (lastChannels[i].channel === channel) {
                    return resolve();
                }
            }
        }
        else {
            reinstall(channel)
                .then(() => {
                    return resolve();
                })
                .catch(() => {
                    return reject();
                })
        }
    })
}

export function reinstall(channel: string) {
    return new Promise<void>(async (resolve, reject) => {
        const data = config.getGameChannel(channel)
        const lastChannels: any = store.get('currentChannelVersion')
        const modpackPath = path.join(config.getGamePath(channel), `JF-${channel}.zip`);
        const dirToRemove = ['config', 'mods', 'scripts', 'defaultconfigs', 'cache', 'kubejs', 'packmenu']
        updateText('Suppression de l\'ancien modpack')
        if (fs.existsSync(modpackPath)) {
                    fs.unlinkSync(modpackPath);
        }
        
        dirToRemove.forEach((d) => {
                    if (fs.existsSync(path.join(config.getGamePath(channel), d))) {
                        fs.removeSync(path.join(config.getGamePath(channel), d))
                    }
        })

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

                    const extract = onezip.extract(modpackPath, config.getGamePath(channel))
                    extract.on('start', ()=> {
                        updateText('Extraction du modpack')
                    })
                    extract.on('progress', (percent: any) => {
                        updateText('Extraction du modpack')
                        updateProgress(percent);
                    })
                    extract.on('error', (error: any) => {
                        console.error(error);
                    });
                    
                    extract.on('end', () => {
                        fs.unlinkSync(modpackPath);
                        if (lastChannels && lastChannels.length > 0) {
                            for(let i = 0; i < lastChannels.length; i++) {
                                if (lastChannels[i].channel === channel) {
                                    lastChannels[i].version = data?.current_pack_version
                                }
                                else {
                                    lastChannels.push({channel: channel, version: data?.current_pack_version})
                                }
                            }
                            store.set('currentChannelVersion', lastChannels)
                        }
                        else {
                            store.set('currentChannelVersion', [{channel: channel, version: data?.current_pack_version}])
                        }


                        return resolve();
                    });
                })
                writer.on('error', (err) => {
                    console.error(err);
                    return reject(err);
                })
            })
            .catch((err) => {
                console.error(err);
                return reject(err);
            })
    })
}

function launch(channel: string) {
    const launcher = new Client();

    const javaPath = path.join(jre, 'bin', 'java');
    console.log(javaPath);
    const channelConfig = config.getGameChannel(channel);

    let opts = {
        // Simply call this function to convert the msmc minecraft object into a mclc authorization object
        authorization: token.mclc(),
        root: config.getGamePath(channel),
        forge: path.join(config.forgePath, `forge-${channelConfig?.mc_version}-${channelConfig?.current_forge_version}-installer.jar`),
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

    launcher.launch(opts);

    launcher.on('debug', (e) => console.log('debug',e));
    launcher.on('arguments', (e) => {
        mainWindow.hide()
    });

    launcher.on('progress', (progress: Progress) => {
        switch (progress.type) {
            case "assets":
                updateText("Téléchargement des assets");
                updateProgress(
                    parseInt(((100.0 * progress.task) / progress.total).toFixed(0))
                );
              break;
            case "natives":
                updateText("Téléchargement des natives");
                updateProgress(
                  parseInt(((100.0 * progress.task) / progress.total).toFixed(0))
                );
              break;
  
            default:
                if (progress.type.includes("classes")) {
                    updateText("Installation de forge");
                    updateProgress(
                        parseInt(((100.0 * progress.task) / progress.total).toFixed(0))
                    );
                } else if (progress.type.includes("assets")) {
                    updateText("Téléchargement des assets");
                    updateProgress(
                        parseInt(((100.0 * progress.task) / progress.total).toFixed(0))
                    );
                }
                break;
        }
    });

    launcher.on('download-status', (progress: Progress) => {
        // updateText(`Téléchargement de ${e.type}`);
        // updateProgress(Math.round(e.current/e.total*100));
        
    });

    launcher.on('close', (e) => {
        mainWindow.show()
        mainWindow.webContents.send("closed", '');
    });
}