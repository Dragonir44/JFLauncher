// Importation des modules
import { app, BrowserWindow, ipcMain, shell } from "electron";
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
    mainWindow.webContents.openDevTools()
}

ipcMain.on("install-update", (_, link) => {
    shell.openExternal(link)
        .then(() => {
            app.quit()
        })
})

ipcMain.on('check-update', () => {
    if (isdev) {
        autoUpdater.updateConfigPath = path.join(__dirname, '../../dev-app-update.yml')
        mainWindow?.webContents.send('update-finished', false)
    }
    else {
        if (process.platform === "darwin") {
            autoUpdater.autoDownload = false;
        }
        autoUpdater.autoDownload = false

        autoUpdater.checkForUpdates()
            .then((res: any) => {
                mainWindow?.webContents.send("update-available", res.versionInfo);
            })
            .catch((err: Error) => {
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