// Importation des modules
const { app, ipcMain, BrowserWindow } = require("electron");
const path = require("path");
const { Client } = require("minecraft-launcher-core");
const {Auth} = require('msmc')
const Store = require("electron-store");

// Variables globales
let mainWindow;
let token;
const store = new Store();

// Création de la fenêtre principale
function createWindow() {
  mainWindow = new BrowserWindow({
    title: "JFLauncher",
    icon: path.join(__dirname, "/assets/logo.ico"),
    width: 800,
    height: 600,
    autoHideMenuBar: false,
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true,
      contextIsolation: false,
      preload: path.join(__dirname, "preload.js")
    },
  });

  // mainWindow.webContents.openDevTools()
  mainWindow.loadFile(path.join(__dirname, "index.html"));
}

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

    mainWindow.loadURL(path.join(__dirname, "app.html"));
  }
  catch(err) {
    console.log(err);
    mainWindow.loadURL(path.join(__dirname, "index.html"));
  }
});

ipcMain.on("loginToken", async (evt, data) => {
  const authManager = new Auth("select_account")
  const xboxManager = await authManager.refresh(data.msToken.refresh_token)
  token = await xboxManager.getMinecraft();
  store.set("token", JSON.stringify(token));
  mainWindow.loadURL(path.join(__dirname, "app.html"));
  mainWindow.webContents.send("userDetails", token);
})

ipcMain.on("getDetails", (evt, data) => {
  evt.returnValue = store.get("token");
})

ipcMain.on('launch', (evt, data) => {
  const launcher = new Client();
  let opts = {
    // Simply call this function to convert the msmc minecraft object into a mclc authorization object
    authorization: token.mclc(),
    root: "./.minecraft",
    clientPackage : "https://nas.team-project.fr/api/public/dl/UAaqG7G1/Perso/JFbeta-1.4.zip",
    removePackage: true,
    forge: "./.minecraft/forge.jar",
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
  launcher.on('data', (e) => {
    if(e.match(/.*EARLYDISPLAY.*/)) {
      mainWindow.hide()
    }
  });

  launcher.on('progress', (e) => {
    console.log("progress", e.type, Math.round(e.task/e.total*100) + '%')
    mainWindow.webContents.send("progress", {type: e.type, progress: Math.round(e.task/e.total*100)});
  });

  launcher.on('download-status', (e) => {
    console.log('download-status', e.type, Math.round(e.current/e.total*100) + '%')
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
  mainWindow.loadURL(path.join(__dirname, "index.html"));
})