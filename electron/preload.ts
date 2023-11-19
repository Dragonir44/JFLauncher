import { contextBridge, ipcRenderer } from "electron";
import os from "os";

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