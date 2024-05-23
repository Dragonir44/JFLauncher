import { ipcMain } from 'electron';
import log from 'electron-log';
import { Client } from "minecraft-launcher-core";
import isdev from 'electron-is-dev';
import fs from 'fs-extra';
import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
const onezip = require('onezip');
import {exec, spawn} from 'child_process';
import {token} from './ipc'
import {updateText, updateProgress, mainWindow} from './main'
import {store} from './main'
import {sysRoot} from './utils/config'

import * as config from './utils/config';


if (isdev) {
    dotenv.config();
}
else {
    dotenv.config({path: path.join(__dirname, '../..', '.env')});
}

log.transports.file.resolvePathFn = () => path.join(config.sysRoot, 'logs', `log-${new Date().toISOString().slice(0, 10)}.log`);

let jre = 'default'
let gameConfig: any;

type Progress = { type: string; task: number; total: number };


export const initGame =  () => {
    ipcMain.on('launch', (_, d) => {
        const serverAddress = d.autoConnect ? d.serverAddress : ''
        const serverPort = d.autoConnect ? d.serverPort : ''
        const channel = d.selectedChannel.channel.value;
        const version = d.selectedChannel.version;

        if (sysRoot.split("/").find((d) => d === 'AppData') && !fs.existsSync(sysRoot)) {
            fs.mkdirSync(sysRoot, { recursive: true });
        }
    
        gameConfig = {
            ram: d.ram,
            window: {
                width: d.width,
                height: d.height,
                fullscreen: d.fullscreen,
            },
            autoConnect: d.autoConnect,
            serverAddress: `${serverAddress}:${serverPort}`
        }
        
        checkJavaInstall()
            .then(() => updatePackAndLaunch(channel, version))
            .catch(() => {
                const jrePath = path.join(config.getSystemRoot(), 'jre');
                if (!fs.existsSync(jrePath)) {
                    fs.mkdirSync(jrePath, { recursive: true });
                }
                if (process.platform === 'linux') {
                    downloadJava(config.jreLinux, path.join(jrePath, 'jdk-linux.zip'), jrePath)
                        .then(() => {
                            updatePackAndLaunch(channel, version)
                        })
                        .catch(() => {
                            log.error('Erreur lors du téléchargement de java');
                        })
                }
                else {
                    downloadJava(config.jreWin, path.join(jrePath, 'jdk-windows.zip'), jrePath)
                        .then(() => {
                            updatePackAndLaunch(channel, version)
                        })
                        .catch(() => {
                            log.error('Erreur lors du téléchargement de java');
                        })
                }
            })
    })
}

export function reinstall(channel: string, version: any) {
    return new Promise<void>(async (resolve, reject) => {
        const downloadLink = `${config.channelDetails}/${channel}/versions/${version.value}/download`
        const lastChannels: any = store.get('currentChannelVersion')
        const modpackPath = path.join(config.getGamePath(channel), `JF-${channel}-${version.value}.zip`);
        const dirToRemove = ['config', 'mods', 'scripts', 'defaultconfigs', 'cache', 'forge', 'kubejs', 'packmenu']

        updateText('launcher.progress.delete-files')

        if (fs.existsSync(modpackPath)) {
            fs.unlinkSync(modpackPath);
        }
        
        dirToRemove.forEach((d) => {
            if (fs.existsSync(path.join(config.getGamePath(channel), d))) {
                fs.removeSync(path.join(config.getGamePath(channel), d))
            }
        })

        updateText('launcher.progress.downloading-modpack')
        axios.get(downloadLink, {headers: {'token': process.env.TOKEN}, responseType: 'stream'})
            .then((res) => {

                const writer = fs.createWriteStream(modpackPath);
                const totalSize = parseInt(res.headers['content-length'], 10);
                let downloadedSize = 0

                res.data.on('data', (chunk: any) => {
                    downloadedSize += chunk.length;
                    const progress = Math.round((downloadedSize / totalSize) * 100)
                    updateText(`launcher.progress.downloading-modpack`);
                    updateProgress(progress);
                })

                res.data.pipe(writer);

                writer.on('finish', () => {

                    const extract = onezip.extract(modpackPath, config.getGamePath(channel))

                    extract.on('start', ()=> {
                        updateText('launcher.progress.extracting-modpack')
                    })
                    extract.on('progress', (percent: any) => {
                        updateText('launcher.progress.extracting-modpack')
                        updateProgress(percent);
                    })
                    extract.on('error', (error: any) => {
                        log.error(error);
                    });
                    
                    extract.on('end', () => {
                        fs.unlinkSync(modpackPath);

                        if (lastChannels && lastChannels.length > 0) {
                            if (lastChannels.some((c: any) => c.channel === channel)) {
                                lastChannels.forEach((c: any) => {
                                    if (c.channel === channel) {
                                        c.version = version.value
                                    }
                                })
                            }
                            else {
                                lastChannels.push({channel: channel, version: version.value})
                            }
                            
                            store.set('currentChannelVersion', lastChannels)
                        }
                        else {
                            store.set('currentChannelVersion', [{channel: channel, version: version.value}])
                        }


                        return resolve();
                    });
                })
                writer.on('error', (err) => {
                    log.error(err);
                    return reject(err);
                })
            })
            .catch((err) => {
                log.error(err);
                return reject(err);
            })
    })
}

function checkJavaInstall() {
    return new Promise<void>((resolve, reject) => {
        const jrePath = path.join(config.getSystemRoot(), 'jre');
        let jreIntallFiles = path.join(jrePath, 'jdk-windows.zip');

        updateText('launcher.progress.checking-java');
        
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
            updateText('launcher.progress.downloading-java')
            axios.get(url, {responseType: 'stream'})
                .then(async (res) => {
                    const writer = fs.createWriteStream(target);
                    const totalSize = parseInt(res.headers['content-length'], 10);
                    let downloadedSize = 0
    
                    res.data.on('data', (chunk: any) => {
                        downloadedSize += chunk.length;
                        const progress = Math.round((downloadedSize / totalSize) * 100)
                        updateText(`launcher.progress.downloading-java`);
                        updateProgress(progress);
                    })

                    res.data.pipe(writer);
                    writer.on('finish', () => {
                        const extract = onezip.extract(target, jrePath)
                        extract.on('start', ()=> {
                            updateText(`launcher.progress.extracting-java`);
                        })
                        extract.on('progress', (percent: any) => {
                            updateText(`launcher.progress.extracting-java`);
                            updateProgress(percent);
                        })
                        extract.on('error', (error: any) => {
                            log.error(error);
                        });
                        
                        extract.on('end', () => {
                            if (process.platform === 'linux') {
                                exec(`chmod +x ${path.join(jrePath, 'bin/java')}`, (err, stdout, stderr) => {
                                    if (err) {
                                        log.error(err);
                                        return reject();
                                    }
                                    jre = jrePath;
                                    return resolve()
                                })
                            }
                            fs.unlinkSync(target);
                            jre = jrePath;
                            return resolve()
                        });
                    })
    
                    writer.on('error', (err) => {
                        log.error(err);
                        return reject();
                    })
                })
                .catch((err) => {
                    log.error(err);
                    return reject();
                })
        }
        catch (err) {
            log.error(err);
            return reject();
        }
    })
}

function updatePackAndLaunch(channel: string, version:any) {
    downloadForge(channel, version)
        .then(() => {
            downloadModpack(channel, version)
                .then(() => {
                    launch(channel, version)
                })
                .catch((err) => {
                    log.error('Erreur lors du téléchargement du modpack', err);
                })
        
        })
        .catch(() => {
            log.error('Erreur lors du téléchargement de forge');
        })
}

function downloadForge(channel: string, version: any) {
    return new Promise<void>((resolve, reject) => {
        const data = config.getGameChannel(channel)
        const forgeDir = path.join(config.getSystemRoot(), 'forge');
        const forgePath = path.join(forgeDir, `forge-${version.forgeVersion}-installer.jar`);

        updateText('launcher.progress.checking-forge')

        if (!fs.existsSync(forgeDir)) {
            fs.mkdirSync(forgeDir, { recursive: true });
        }

        if (fs.existsSync(forgePath) && data?.current_forge_version) {
            return resolve();
        }
        else {
            if (fs.existsSync(forgePath))
                fs.unlinkSync(forgePath);
                
            updateText('launcher.progress.downloading-forge')

            const forgeLink = config.forgeBaseLink.replace(/%foVer/g, version.forgeVersion as string)

            axios.get(forgeLink, {responseType: 'stream'})
                .then((res) => {

                    const writer = fs.createWriteStream(forgePath);
                    const totalSize = parseInt(res.headers['content-length'], 10);
                    let downloadedSize = 0

                    res.data.on('data', (chunk: any) => {
                        downloadedSize += chunk.length;
                        const progress = Math.round((downloadedSize / totalSize) * 100)
                        updateText(`launcher.progress.downloading-forge`);
                        updateProgress(progress);
                    })

                    res.data.pipe(writer);

                    writer.on('finish', () => {
                        return resolve();
                    })
                    writer.on('error', (err) => {
                        log.error(err);
                        return reject();
                    })
                })
                .catch((err) => {
                    log.error(err);
                    return reject();
                })
        }
    })

}

function downloadModpack(channel: string, version: any) {
    return new Promise<void>(async (resolve, reject) => {
        const oldLatest = store.get('latestVersion') as any || null
        const latestVersion = version.versionFile

        updateText('launcher.progress.checking-modpack')
        if (oldLatest && latestVersion === oldLatest) {
            return resolve();
        }
        else {
            reinstall(channel, version)
                .then(() => {
                    return resolve();
                })
                .catch((e) => {
                    return reject(e);
                })
        }
    })
}

function launch(channel: string, version: any) {
    const launcher = new Client();

    const javaPath = path.join(jre, 'bin', 'java');

    let opts:any = {
        authorization: token.mclc(),
        root: config.getGamePath(channel),
        forge: path.join(config.getSystemRoot(), 'forge', `forge-${version.forgeVersion}-installer.jar`),
        javaPath: javaPath,
        version: {
            number: version.forgeVersion.split('-')[0] as string,
            type: "release"
        },
        memory: {
            max: `${gameConfig.ram}G`,
            min:'1G'
        },
        window: {
            fullscreen: gameConfig.window.fullscreen,
            width: gameConfig.window.width,
            height: gameConfig.window.height,
        },
    };

    opts.quickPlay = gameConfig.autoConnect ? {
        type: "multiplayer",
        identifier: gameConfig.serverAddress,
    } : undefined

    log.info('launch', opts);
    launcher.launch(opts);

    if (store.get('detachProcess') == true)
        spawn(javaPath).unref()

    launcher.on('debug', (e) => log.info('debug',e));
    launcher.on('arguments', (e) => {
        updateText('launcher.progress.launching')
        store.set('latestVersion', version.versionFile)
        if (store.get('keepOpen') == true) {
            mainWindow.minimize()
        }
        else {
            mainWindow.hide()
        }
    });

    launcher.on('progress', (progress: Progress) => {
        switch (progress.type) {
            case "assets":
                updateText("launcher.progress.downloading-assets");
                updateProgress(
                    parseInt(((100.0 * progress.task) / progress.total).toFixed(0))
                );
              break;
            case "natives":
                updateText("launcher.progress.downloading-natives");
                updateProgress(
                  parseInt(((100.0 * progress.task) / progress.total).toFixed(0))
                );
              break;
  
            default:
                if (progress.type.includes("classes")) {
                    updateText("launcher.progress.downloading-classes");
                    updateProgress(
                        parseInt(((100.0 * progress.task) / progress.total).toFixed(0))
                    );
                } else if (progress.type.includes("assets")) {
                    updateText("launcher.progress.downloading-assets");
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