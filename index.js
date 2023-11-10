// Importation des modules
const { app, ipcMain, BrowserWindow } = require("electron");
const path = require("path");
const { Client } = require("minecraft-launcher-core");
const {Auth} = require('msmc')
const store = require("store");

// Variables globales
let mainWindow;

// Création de la fenêtre principale
function createWindow() {
  mainWindow = new BrowserWindow({
    title: "JFLauncher",
    icon: path.join(__dirname, "/asset/logo.png"),
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true,
      contextIsolation: false,
      preload: path.join(__dirname, "preload.js")
    },
  });

  mainWindow.webContents.openDevTools()
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
  const authManager = new Auth("select_account")
  const xboxManager = await authManager.launch("raw")
  const token = await xboxManager.getMinecraft();

  store.set("token", JSON.stringify(token));
  console.log(store.get("token"));

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
      max: "11G",
      min: "4G"
    }
  };
  console.log("Starting!");
  // launcher.launch(opts);

  launcher.on('debug', (e) => console.log(e));
  launcher.on('data', (e) => console.log(e));
});

ipcMain.on("loginToken", async (evt, data) => {
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
      max: "11G",
      min: "4G"
    }
  };
  console.log("Starting via token!");
  launcher.launch(opts);

  launcher.on('debug', (e) => console.log(e));
  launcher.on('data', (e) => console.log(e));
})