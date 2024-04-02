import { app, ipcMain, shell } from "electron";
import {Auth} from 'msmc'
import axios from "axios";
import * as config from './utils/config';
import { getStatus } from 'minecraft-ping-server/lib'
import dotenv from 'dotenv'
import log from "electron-log";

import { mainWindow, store } from "./main";
import { reinstall } from "./game"

dotenv.config()

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
            log.error(err);
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

    ipcMain.on("getChannelsFromServer", () => {
        axios.get(config.channelDetails, {headers: {"token": process.env.TOKEN},responseType: 'json'})
            .then((res) => {
                log.info(res.data)
                mainWindow?.webContents.send("getChannelsFromServer-complete", res.data);
            }
            ).catch((err) => {
                log.error(err);
                mainWindow?.webContents.send("getChannelsFromServer-failed", err);
            })
    })

    ipcMain.on("getChannelVersions", (_, data) => {
        axios.get(`${config.channelDetails}/${data}`, {headers: {"token": process.env.TOKEN},responseType: 'json'})
            .then((res) => {
                log.info(res.data)
                mainWindow?.webContents.send("getChannelVersions-complete", res.data);
            })
            .catch((err) => {
                log.error(err);
                mainWindow?.webContents.send("getChannelVersions-failed", err);
            })
    })

    ipcMain.on('server-ping', () => {
        // config.loadConfig()
        const serverData = store.get("config") as config.Config
        getStatus(serverData.server.address, serverData.server.port)
            .then((res) => {
                log.info(res);
                mainWindow?.webContents.send("server-ping-response", res);
            })
            .catch((err) => {
                log.error(err);
                mainWindow?.webContents.send("server-ping-response", err);
            })
    })

    ipcMain.on("showFolder", () => {
        shell.openPath(config.gamePath);
    
    })
    
    ipcMain.on('reinstall', (_, data) => {
        reinstall(data.channel, data.version)
            .then(() => {
                log.info("Reinstall complete");
                mainWindow?.webContents.send("reinstall-complete");
            })
            .catch((err) => {
                log.error(err);
                mainWindow?.webContents.send("reinstall-failed", err);
            })
    })
    
    ipcMain.handle('getStore', (_, data) => {
        return store.get(data);
    })
    
    ipcMain.handle('setStore', (_, data) => {
        return store.set(data.key, data.value);
    })

    ipcMain.on("reset", () => {
        log.info("Resetting app");
        mainWindow?.webContents.send("reset-complete");
    })

    ipcMain.on('confirm-reset', () => {
        store.clear();
        app.relaunch();
        app.quit();
    })

    ipcMain.on("quit-app", () => {
        app.quit();
    })
}