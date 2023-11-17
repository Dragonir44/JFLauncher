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

const sysRoot =
  process.env.APPDATA ||
  (process.platform == "darwin"
    ? process.env.HOME + "/Library/Application Support"
    : process.env.HOME) as string;

autoUpdater.logger = log;

log.info('App starting...');

// Object.defineProperty(app, 'isPackaged', {
  // get() {
    // return true;
  // }
// });

// Variables globales
let mainWindow: BrowserWindow;
let token: any;
const store = new Store();
const srcPath: string = '../../src/public'

function sendStatusToWindow(text: string, version: string) {
  log.info(text, version);
  mainWindow.webContents.send('message', {text: text, version: version});
}

// Création de la fenêtre principale
function createWindow() {
  console.log(__dirname)
  mainWindow = new BrowserWindow({
    title: "JFLauncher",
    icon: path.join(__dirname, srcPath,"assets/logo.ico"),
    width: 800,
    height: 600,
    autoHideMenuBar: false,
    webPreferences: {
      nodeIntegration: true,
      // enableRemoteModule: true,
      contextIsolation: false,
      preload: path.join(__dirname, "preload.js")
    },
  });

  // mainWindow.webContents.openDevTools()
  mainWindow.loadFile(path.join(__dirname, srcPath, "index.html"));
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
    mainWindow.loadURL(path.join(__dirname, srcPath, `app.html#${app.getVersion()}`));
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
  mainWindow.loadURL(path.join(__dirname, srcPath, `app.html#${app.getVersion()}`));
  mainWindow.webContents.send("userDetails", token);
})

ipcMain.on("getDetails", (evt, data) => {
  evt.returnValue = store.get("token");
})

ipcMain.on('launch', (evt, data) => {
  const launcher = new Client();

  if (!fs.existsSync(path.join(sysRoot, '.JFLauncher', data.channel))) {
    fs.mkdirSync(path.join(sysRoot, '.JFLauncher', data.channel), { recursive: true });
  }

  let opts = {
    // Simply call this function to convert the msmc minecraft object into a mclc authorization object
    authorization: token.mclc(),
    root: path.join(sysRoot, '.JFLauncher', data.channel),
    clientPackage : `https://nas.team-project.fr/api/public/dl/qhdPbmWq/JimmuFactory/JF-${data.channel}.zip`,
    removePackage: true,
    forge: path.join(sysRoot, '.JFLauncher', data.channel, 'forge.jar'),
    version: {
      number: "1.20.1",
      type: "release"
    },
    memory: {
      max: `${data.ram}G`,
      min:'1G'
    }
  };
  launcher.launch(opts);

  // launcher.on('debug', (e) => console.log('debug',e));
  launcher.on('arguments', (e) => {
    mainWindow.hide()
  });

  launcher.on('progress', (e) => {
    // console.log("progress", e.type, Math.round(e.task/e.total*100) + '%')
    mainWindow.webContents.send("progress", {type: e.type, progress: Math.round(e.task/e.total*100)});
  });

  launcher.on('download-status', (e) => {
    // console.log('download-status', e.type, Math.round(e.current/e.total*100) + '%')
    mainWindow.webContents.send("progress", {type: e.type, progress: Math.round(e.current/e.total*100)});
  });

  launcher.on('close', (e) => {
    mainWindow.show()
    mainWindow.webContents.send("closed", '');
  });
})

ipcMain.on('deco', (evt, data) => {
  store.delete("token");
  store.delete("userDetails");
  mainWindow.loadURL(path.join(__dirname, srcPath, "index.html"));
})