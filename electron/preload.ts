import { contextBridge, ipcRenderer } from "electron";
import os from "os";
const shell = require("shell");
import ReactHtmlParser from 'react-html-parser';

contextBridge.exposeInMainWorld("ipc", {
    send: (channel: string, data?: any) => {
      ipcRenderer.send(channel, data);
    },
    receive: (channel: string, func: (...datas: any) => void) => {
        ipcRenderer.on(channel, (event, ...args) => func(...args));
    },
    sendSync: (channel: string, data?: any) => {
      return ipcRenderer.sendSync(channel, data);
    }
});

contextBridge.exposeInMainWorld("os", {
    totalmem: () => {
        return os.totalmem();
    },
    type: () => {
        return os.type()
    }
});

contextBridge.exposeInMainWorld("store", {
    get: (key: string) => {
        return ipcRenderer.invoke("getStore", key);
    },
    set: (key: string, value: any) => {
        ipcRenderer.invoke("setStore", {key: key, value: value});
    },
});

contextBridge.exposeInMainWorld("shell", {
    openExternal: (url: string) => {
        shell.openExternal(url);
    }
});

contextBridge.exposeInMainWorld("html", {
    parse: (html: string) => {
        return ReactHtmlParser(html);
    }
});