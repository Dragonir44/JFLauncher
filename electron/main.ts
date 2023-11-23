// Importation des modules
import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import url from "url";
import Store from "electron-store";
import log from 'electron-log';
import { autoUpdater, AppUpdater } from "electron-updater"
import isdev from 'electron-is-dev';
import { initIpc } from "./ipc";
import { initGame } from "./game";
import fs from "fs-extra";

import * as config from './utils/config';

autoUpdater.logger = log;
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;

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
        title: `JFLauncher - ${app.getVersion()}`,
        icon: !isdev ? path.join(__dirname, "../assets/logo.ico") : path.join(__dirname, publicPath, "assets/logo.ico"),
        width: 1280,
        height: 729,
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

ipcMain.on("install-updates", () => {
    autoUpdater.quitAndInstall();
});

ipcMain.on('check-update', () => {
    if (isdev) {
        autoUpdater.updateConfigPath = path.join(__dirname, '../../dev-app-update.yml')
        mainWindow?.webContents.send('update-finished', false)
    }
    else {
        if (process.platform === "darwin") {
            autoUpdater.autoDownload = false;
        }

        autoUpdater.allowPrerelease = false;
        autoUpdater.on("update-downloaded", () => {
            fs.writeFileSync(path.join(config.getGamePath('beta'), 'update-downloaded.txt'), "Update downloaded");
            mainWindow?.webContents.send("update-finished", true);
        });

        autoUpdater.on("update-not-available", () => {
            fs.writeFileSync(path.join(config.getGamePath('beta'), 'test.txt'), "No update available");
            mainWindow?.webContents.send("update-finished", false);
        });

        autoUpdater.on("error", (err: Error) => {
            fs.writeFileSync(path.join(config.getGamePath('beta'), 'update-error.txt'), JSON.stringify(err));
            mainWindow?.webContents.send("update-failed", err.message);
        });

        autoUpdater.on("download-progress", (progress) => {
            fs.writeFileSync(path.join(config.getGamePath('beta'), 'update-progress.txt'), JSON.stringify(progress));
            mainWindow?.webContents.send("update-progress", progress.percent.toFixed(2));
        });

        autoUpdater.checkForUpdates().catch((err: Error) => {
            fs.writeFileSync(path.join(config.getGamePath('beta'), 'update-failed.txt'), JSON.stringify(err));
            mainWindow?.webContents.send("update-failed", err.message);
        });
    }
})

// Quand l'application est chargée, afficher la fenêtre
app.whenReady().then(() => {
    createWindow();
    autoUpdater.checkForUpdates()
    app.on("activate", function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

// Si toutes les fenêtres sont fermées, quitter l'application
app.on("window-all-closed", function () {
    if (process.platform !== "darwin") app.quit();
});