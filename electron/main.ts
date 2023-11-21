// Importation des modules
import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import url from "url";
import Store from "electron-store";
import log from 'electron-log';
import { autoUpdater } from "electron-updater"
import isdev from 'electron-is-dev';
import { initIpc } from "./ipc";
import { initGame } from "./game";
import fs from "fs-extra";

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

        autoUpdater.allowPrerelease = true;
        autoUpdater.on("update-downloaded", () => {
            mainWindow?.webContents.send("update-finished", true);
        });

        autoUpdater.on("update-not-available", () => {
            fs.writeFileSync(path.join(config.getGamePath('beta'), 'test.txt'), "No update available");
            mainWindow?.webContents.send("update-finished", false);
        });

        autoUpdater.on("error", (err: Error) => {
            mainWindow?.webContents.send("update-failed", err.message);
        });

        autoUpdater.on("download-progress", (progress) => {
            mainWindow?.webContents.send("update-progress", progress.percent.toFixed(2));
        });

        autoUpdater.checkForUpdates().catch((err: Error) => {
            mainWindow?.webContents.send("update-failed", err.message);
        });
    }
})

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