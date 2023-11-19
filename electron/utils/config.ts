import fs from "fs";
import path from "path";
import { app } from "electron";
import Store from "electron-store";
import log from "electron-log";
import axios from "axios";

export const launcherConfig = "https://web.team-project.fr/api/launcher/config.json"
export const launcherName = "JFLauncher"
export const jreWin = 'https://dd06-dev.fr/dl/jre/jre-windows.zip'
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
    axios.get(launcherConfig).then((res) => {
        const store = new Store();
        store.set("config", res.data);
    }
    ).catch((err) => {
        log.error(err);
    })
}

