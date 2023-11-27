import { app, ipcMain, BrowserWindow, Menu } from "electron";
import {Auth} from 'msmc'
import path from "path";
import * as config from './utils/config';

import { mainWindow, store } from "./main";

export let token: any;

export const initIpc = () => {
    ipcMain.on("login", async () => {
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
            mainWindow.loadURL(path.join(__dirname, "..", "index.html"));
        }
    });
    
    ipcMain.on("loginToken", async (_, data) => {
        const authManager = new Auth("select_account")
        const xboxManager = await authManager.refresh(data.msToken.refresh_token)
        token = await xboxManager.getMinecraft();
        store.set("token", JSON.stringify(token));
    
        mainWindow?.webContents.send("auth-success", app.getVersion());
        mainWindow.webContents.send("userDetails", token);
    })
    
    ipcMain.on("getDetails", (evt, ) => {
        evt.returnValue = store.get("token");
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
    
    ipcMain.on('deco', () => {
      store.delete("token");
      store.delete("userDetails");
      
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