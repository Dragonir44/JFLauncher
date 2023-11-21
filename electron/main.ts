// Importation des modules
import { app, BrowserWindow } from "electron";
import path from "path";
import url from "url";
import Store from "electron-store";
import log from 'electron-log';
import { autoUpdater } from "electron-updater"
import isdev from 'electron-is-dev';
import { initIpc } from "./ipc";
import { initGame } from "./game";

import * as config from './utils/config';
config.loadConfig();

autoUpdater.logger = log;

log.info('App starting...');

// Variables globales
export let mainWindow: BrowserWindow;
export const store = new Store();
const publicPath: string = '../../public'

function sendStatusToWindow(text: string, version: string) {
    log.info(text, version);
    mainWindow.webContents.send('message', {text: text, version: version});
}

export function updateText(text: string) {
    mainWindow.webContents.send('updateText', text);
}

export function updateProgress(progress: number) {
    mainWindow.webContents.send('updateProgress', progress);
}

// Création de la fenêtre principale
function createWindow() {
    mainWindow = new BrowserWindow({
        title: "JFLauncher",
        icon: !isdev ? path.join(__dirname, "../assets/logo.ico") : path.join(__dirname, publicPath, "assets/logo.ico"),
        width: 1280,
        height: 729,
        autoHideMenuBar: !isdev,
        webPreferences: {
            nodeIntegration: true,
            preload: path.join(__dirname, "preload.js")
        },
    });

    initIpc()
    initGame()

    if (!isdev) {
        mainWindow.loadURL(url.format({
            protocol: "file",
            pathname: path.join(__dirname, "..", "index.html"),
            slashes: true
        }));
    }
    else {
        mainWindow.loadURL(`http://localhost:3000`);
        mainWindow.webContents.openDevTools()
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