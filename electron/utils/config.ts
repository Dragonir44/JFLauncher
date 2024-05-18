import fs from "fs";
import path from "path";
import { app } from "electron";
import Store from "electron-store";
import log from "electron-log";
import axios from "axios";

const store = new Store();

const launcherConfig = "https://nas.team-project.fr/api/public/dl/44b-BPCs/JimmuFactory/version-manifest.json"
export const channelDetails = "https://jfl.api.team-project.fr/channels"
export const news = "https://jfl.api.team-project.fr/news"
export const launcherName = "JFLauncher"
export const jreWin = 'https://nas.team-project.fr/api/public/dl/sMMcaiwv/JimmuFactory/jdk-windows.zip'
export const jreLinux = 'https://nas.team-project.fr/api/public/dl/PpIWU3XD/JimmuFactory/jdk-linux.zip'
export const forgeBaseLink = 'https://maven.minecraftforge.net/net/minecraftforge/forge/%foVer/forge-%foVer-installer.jar'

export let sysRoot = store.get('gamePath') as string || path.join(process.env.APPDATA as string || (process.platform == "darwin" ? process.env.HOME + "/Library/Application Support" : process.env.HOME as string), '.JFLauncher');
const refreshTime = 5 * 1000
export const forgePath = path.join(sysRoot, "forge")
export const jrePath = path.join(sysRoot, "jre")
const launcherDir = process.env.CONFIG_DIRECT_PATH || app.getPath("userData");

store.set("refreshTime", refreshTime)

export type Config = {
    server: {
        address: string,
        port: number
    }
    channel: [
        {
            channel_name: string,
            mc_version: string,
            current_pack_version: string,
            current_forge_version: string,
            release_date: Date,
            download_link: string
        }
    ]
    news:any
}

export const updateSystemRoot = (path: string) => {
    sysRoot = path;
    store.set('gamePath', path);
}

export const getSystemRoot = () => {
    return sysRoot;
}

export const getGamePath = (channel: string) => {
    if (!fs.existsSync(path.join(sysRoot, channel))) {
        fs.mkdirSync(path.join(sysRoot, channel), { recursive: true })
    }
    return path.join(sysRoot, channel)
}

export const loadConfig = () => {
    axios({url: launcherConfig, method: 'GET', responseType: 'json'}).then((res) => {
        store.set("config", res.data);
    }
    ).catch((err) => {
        log.error(err);
    })
}

export const getGameChannelList = () => {
    const config = store.get("config") as Config
    return config.channel
}

export const getGameChannel = (channel: string) => {
    const config = store.get("config") as Config
    return config.channel.find((c) => c.channel_name === channel)
}

setInterval(() => {
    // loadConfig()
}, refreshTime)