// Importation des modules
import { app, BrowserWindow, ipcMain, shell } from "electron";
import path from "path";
import fs from "fs-extra";
import url from "url";
import Store from "electron-store";
import log from 'electron-log';
import { autoUpdater, AppUpdater } from "electron-updater"
import isdev from 'electron-is-dev';
import { initIpc } from "./ipc";
import { initGame } from "./game";

import * as config from './utils/config';

log.transports.file.resolvePathFn = () => path.join(config.sysRoot, 'logs', `log-${new Date().toISOString().slice(0, 10)}.log`);

autoUpdater.logger = log;
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;

log.info('App starting...');

// Variables globales
export let mainWindow: BrowserWindow;
export const store = new Store();
const publicPath: string = '../../public'

export function updateText(text: string) {
    mainWindow.webContents.send('updateText', text);
}

export function updateProgress(progress: number) {
    mainWindow.webContents.send('updateProgress', progress);
}

// Création de la fenêtre principale
function createWindow() {
    mainWindow = new BrowserWindow({
        title: `JFLauncher - ${app.getVersion()}`,
        icon: !isdev 
            ? process.platform == "win32"
                ? path.join(__dirname, "..", "assets", "logo.ico")
                : path.join(__dirname, "..", "assets", "logo.png")
            : process.platform == "win32"
                ? path.join(__dirname, publicPath, "assets/logo.ico")
                : path.join(__dirname, publicPath, "assets/logo.png"),
        width: 1280,
        height: 729,
        minHeight: 560,
        minWidth: 900,
        frame: isdev,
        autoHideMenuBar: !isdev,
        webPreferences: {
            nodeIntegration: true,
            preload: path.join(__dirname, "preload.js")
        },
    });
    
    config.loadConfig();
    initIpc()
    initGame()
    // store.delete('currentChannelVersion')
    // store.delete('registeredAccounts')
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

ipcMain.on("install-update", (_, link) => {
    if (process.platform === 'linux') {
        autoUpdater.downloadUpdate()
        autoUpdater.quitAndInstall()
    }
    else {
        shell.openExternal(link)
        .then(() => {
            app.quit()
        })
    }
})

ipcMain.on('open-external-link', (_, link) => {
    shell.openExternal(link)
})

autoUpdater.on("update-not-available", () => {
    mainWindow?.webContents.send('no-update');
});

autoUpdater.on("update-available", (res) => {
    mainWindow?.webContents.send("update-available", res);
});

ipcMain.on('check-update', () => {
    if (isdev) {
        autoUpdater.updateConfigPath = path.join(__dirname, '../../dev-app-update.yml')
        mainWindow?.webContents.send('no-update')
    }
    else {
        if (process.platform === "darwin") {
            autoUpdater.autoDownload = false;
        }
        autoUpdater.autoDownload = false

        autoUpdater.checkForUpdates()
    }
})

ipcMain.on('download-progress', (_, progress) => {
    mainWindow?.webContents.send('download-progress', progress);
})

// Quand l'application est chargée, afficher la fenêtre
app.whenReady().then(() => {
    store.delete("token");
    store.delete("userDetails");

    createWindow();
    app.on("activate", function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

// Si toutes les fenêtres sont fermées, quitter l'application
app.on("window-all-closed", function () {
    if (process.platform !== "darwin") app.quit();
});

app.commandLine.appendSwitch('ignore-gpu-blacklist');
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('disable-gpu-compositing');
app.disableHardwareAcceleration()