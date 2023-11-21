import fs from "fs";
import path from "path";
import { app } from "electron";
import Store from "electron-store";
import log from "electron-log";
import axios from "axios";

const store = new Store();

export const launcherConfig = "https://nas.team-project.fr/api/public/dl/44b-BPCs/JimmuFactory/version-manifest.json"
export const launcherName = "JFLauncher"
export const jreWin = 'https://nas.team-project.fr/api/public/dl/sMMcaiwv'
export const jreLinux = 'https://dd06-dev.fr/dl/jre/jre-linux.zip'

const sysRoot = process.env.APPDATA || (process.platform == 'darwin' ? process.env.HOME + 'Library/Application Support' : process.env.HOME) as string;
const gamePath = path.join(sysRoot, `.${launcherName}`)
const launcherDir = process.env.CONFIG_DIRECT_PATH || app.getPath("userData");

export const getGamePath = (channel: string) => {
    if (!fs.existsSync(path.join(gamePath, channel))) {
        fs.mkdirSync(path.join(gamePath, channel), { recursive: true })
    }
    return path.join(gamePath, channel)
}

export const loadConfig = () => {
    if (store.get("config") == undefined) {
        axios({url: launcherConfig, method: 'GET', responseType: 'json'}).then((res) => {
            store.set("config", res.data);
        }
        ).catch((err) => {
            log.error(err);
        })
    }
}

