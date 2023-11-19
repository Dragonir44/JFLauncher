// Importation des modules
import { app, ipcMain, BrowserWindow, Menu } from "electron";
import path from "path";
import { Client } from "minecraft-launcher-core";
import {Auth} from 'msmc'
import Store from "electron-store";
import log from 'electron-log';
import { autoUpdater } from "electron-updater"
import os from 'os';
import fs from 'fs-extra';
import axios from 'axios';
import AdmZip from 'adm-zip';
import ChildProcess from 'child_process';

import * as config from './utils/config';

const sysRoot = process.env.APPDATA || (process.platform == "darwin"
    ? process.env.HOME + "/Library/Application Support"
    : process.env.HOME) as string;

autoUpdater.logger = log;

log.info('App starting...');

// Variables globales
let mainWindow: BrowserWindow;
let token: any;
let jre = 'default'
let gameConfig: any;
const store = new Store();
const srcPath: string = '../../src'
const publicPath: string = '../../public'

function sendStatusToWindow(text: string, version: string) {
    log.info(text, version);
    mainWindow.webContents.send('message', {text: text, version: version});
}

function updateText(text: string) {
    mainWindow.webContents.send('updateText', text);
}

function updateProgress(progress: number) {
    mainWindow.webContents.send('updateProgress', progress);
}

// Création de la fenêtre principale
function createWindow() {
    mainWindow = new BrowserWindow({
        title: "JFLauncher",
        icon: path.join(__dirname, publicPath, "assets/logo.ico"),
        width: 1280,
        height: 729,
        autoHideMenuBar: false,
        webPreferences: {
            nodeIntegration: true,
            preload: path.join(__dirname, "preload.js")
        },
    });

  // mainWindow.webContents.openDevTools()
    if (app.isPackaged) {
        mainWindow.loadURL(`file//${path.join(__dirname, srcPath, "index.html")}`);
    }
    else {
        mainWindow.loadURL(`http://localhost:3000`);
    }
}

autoUpdater.on('checking-for-update', () => {
    sendStatusToWindow('Checking for update...', app.getVersion());
})
autoUpdater.on('update-available', (info) => {
    sendStatusToWindow('Update available.', app.getVersion());
})
autoUpdater.on('update-not-available', (info) => {
    sendStatusToWindow('Update not available.', app.getVersion());
})
autoUpdater.on('error', (err) => {
    sendStatusToWindow('Error in auto-updater. ' + err, app.getVersion());
})
autoUpdater.on('download-progress', (progressObj) => {
    let log_message = "Download speed: " + progressObj.bytesPerSecond;
    log_message += ' - Downloaded ' + progressObj.percent + '%';
    log_message += ' (' + progressObj.transferred + "/" + progressObj.total + ')';
    sendStatusToWindow(log_message, app.getVersion());
})
autoUpdater.on('update-downloaded', (info) => {
    sendStatusToWindow('Update downloaded', app.getVersion());
});

app.on('ready', ()=> {
    autoUpdater.checkForUpdatesAndNotify()
})

// Quand l'application est chargée, afficher la fenêtre
app.whenReady().then(() => {
    createWindow();

    app.on("activate", function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

// Si toutes les fenêtres sont fermées, quitter l'application
app.on("window-all-closed", function () {
    if (process.platform !== "darwin") app.quit();
});

// Quand un utilisateur tente de se connecter
ipcMain.on("login", async (evt, data) => {
    try {
        const authManager = new Auth("select_account")
        const xboxManager = await authManager.launch("raw")
        token = await xboxManager.getMinecraft();

        store.set("userDetails", JSON.stringify(xboxManager));
        store.set("token", JSON.stringify(token));
        mainWindow?.webContents.send("auth-success", app.getVersion());
    }
    catch(err) {
        console.log(err);
        mainWindow.loadURL(path.join(__dirname, srcPath, "index.html"));
    }
});

ipcMain.on("loginToken", async (evt, data) => {
    const authManager = new Auth("select_account")
    const xboxManager = await authManager.refresh(data.msToken.refresh_token)
    token = await xboxManager.getMinecraft();
    store.set("token", JSON.stringify(token));

    mainWindow?.webContents.send("auth-success", app.getVersion());
    mainWindow.webContents.send("userDetails", token);
})

ipcMain.on("getDetails", (evt, data) => {
    evt.returnValue = store.get("token");
})

ipcMain.on("getVersion", (evt, data) => {
    evt.returnValue = app.getVersion();
})


function checkJavaInstall(channel: string) {
    return new Promise<void>((resolve, reject) => {
        const jrePath = path.join(config.getGamePath(channel), 'jre');
        let jreIntallFiles = path.join(jrePath, 'jre-windows.zip');
        
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
                data = data.split('\n')[0]
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
        // const {data, headers} = await axios({url: url, method: 'GET', responseType: 'stream'});
        axios({
            url: url, 
            method: 'GET', 
            responseType: 'arraybuffer',
            onDownloadProgress: (progressEvent) => {
                const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                console.log(`Progression: ${progress}%`);
                // Tu peux appeler ici une fonction pour mettre à jour la barre de progression dans ton application
            }
        })
            .then(async (res) => {
                const totalLength = parseInt(res.headers["content-length"]);
                let receivedBytes = 0;

                
                const buffer = Buffer.from(res.data, 'binary');
                await fs.writeFileSync(target, buffer);

                
    
                // res.data.on("data", (chunk: {length: number}) => {
                //     receivedBytes += chunk.length;
                //     updateText('Téléchargement de Java')
                //     updateProgress(Math.round((receivedBytes * 100) / totalLength));
                // });

                if (fs.statSync(target).size === parseInt(res.headers['content-length'])) {
                    const zip = new AdmZip(target);
                    zip.extractAllTo(jrePath, true);
                    fs.unlinkSync(target);
                    jre = jrePath;
                    launch(channel)
                }

                // const writer = fs.createWriteStream(target);
                // console.log(res)
    
                // res.data.pipe(writer);
    
                // res.data.on("end", async () => {
                //     const res = await axios.head(url);
    
                //     if (fs.statSync(target).size === parseInt(res.headers['content-length'])) {
                //         const zip = new AdmZip(target);
                //         zip.extractAllTo(jrePath, true);
                //         fs.unlinkSync(target);
                //         jre = jrePath;
                //         launch(channel)
                //     }
                // })
            })
            .catch((err) => {
                console.error(err);
            })
    }
    catch (err) {
        console.error(err);
    }
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

    launcher.on('debug', (e) => console.log('debug',e));
    launcher.on('arguments', (e) => {
        mainWindow.hide()
    });

    launcher.on('progress', (e) => {
        // console.log("progress", e.type, parseInt((100.0*e.task/e.total).toFixed(0)))
        updateText(e.type);
        updateProgress(parseInt((100.0*e.task/e.total).toFixed(0)));
    });

    launcher.on('download-status', (e) => {
        // console.log('download-status', e.type, Math.round(e.current/e.total*100) + '%')
        updateText(e.type);
        updateProgress(Math.round(e.current/e.total*100));
    });

    launcher.on('close', (e) => {
        console.log('close', e);
        mainWindow.show()
        mainWindow.webContents.send("closed", '');
    });
}


ipcMain.on('launch', async (evt, d) => {
    if (!fs.existsSync(path.join(sysRoot, '.JFLauncher', d.channel))) {
        fs.mkdirSync(path.join(sysRoot, '.JFLauncher', d.channel), { recursive: true });
    }

    gameConfig = {
        ram: d.ram,
    }

    await checkJavaInstall(d.channel)
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

ipcMain.on('deco', (evt, data) => {
  store.delete("token");
  store.delete("userDetails");
  
})

ipcMain.handle('getStore', (evt, data) => {
    return store.get(data);
})

ipcMain.handle('setStore', (evt, data) => {
    return store.set(data.key, data.value);
})