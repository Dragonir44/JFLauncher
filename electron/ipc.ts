import { app, ipcMain, shell } from "electron";
import {Auth} from 'msmc'
import path from "path";
import * as config from './utils/config';
import { getStatus } from 'minecraft-ping-server/lib'

import { mainWindow, store } from "./main";
import { reinstall } from "./game"

export let token: any;

export const initIpc = () => {
    ipcMain.on("login", async () => {
        try {
            const authManager = new Auth("select_account")
            let currentAccounts = JSON.parse(store.get("registeredAccounts") as string || "[]");
            const xboxManager = await authManager.launch("electron")
            token = await xboxManager.getMinecraft();

            await currentAccounts.push({manager: xboxManager, token: token});
            store.set("registeredAccounts", JSON.stringify(currentAccounts));

            mainWindow?.webContents.send("auth-success");
        }
        catch(err) {
            console.log(err);
            mainWindow?.webContents.send("auth-failed", err);
            // mainWindow.loadURL(path.join(__dirname, "..", "index.html"));
        }
    });
    
    ipcMain.on("loginToken", async (_, data) => {
        const selectedAccount = JSON.parse(data)
        const authManager = new Auth("select_account")
        const xboxManager = await authManager.refresh(selectedAccount.manager.msToken.refresh_token)
        
        token = await xboxManager.getMinecraft();
        store.set('selectedAccount', JSON.stringify({manager: xboxManager, token: token}))
    
        mainWindow?.webContents.send("connect");
    })
    
    ipcMain.on("getDetails", (evt, ) => {
        evt.returnValue = store.get("registeredAccounts");
    })
    
    ipcMain.on("getVersion", (evt,) => {
        evt.returnValue = app.getVersion();
    })

    ipcMain.on("getChannels", (evt) => {
        evt.returnValue = config.getGameChannelList();
    })

    ipcMain.on("getChannel", (evt, data) => {
        evt.returnValue = config.getGameChannel(data);
    })

    ipcMain.on('server-ping', () => {
        config.loadConfig()
        const serverData = store.get("config") as config.Config
        getStatus(serverData.server.address, serverData.server.port)
            .then((res) => {
                mainWindow?.webContents.send("server-ping-response", res);
            })
            .catch((err) => {
                mainWindow?.webContents.send("server-ping-response", err);
            })
    })

    ipcMain.on("showFolder", () => {
        shell.openPath(config.gamePath);
    
    })
    
    ipcMain.on('reinstall', (_, data) => {
        reinstall(data.channel)
            .then(() => {
                mainWindow?.webContents.send("reinstall-complete");
            })
            .catch((err) => {
                mainWindow?.webContents.send("reinstall-failed", err);
            })
    })

    ipcMain.on('updateChannel', (_, data) => {
        mainWindow?.webContents.send("updateChannel");
    })
    
    ipcMain.handle('getStore', (_, data) => {
        return store.get(data);
    })
    
    ipcMain.handle('setStore', (_, data) => {
        return store.set(data.key, data.value);
    })

    ipcMain.on("quit-app", () => {
        app.quit();
    })
}