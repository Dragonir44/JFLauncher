import React from "react";
import { createRoot } from "react-dom/client";
import { HashRouter, Routes, Route } from "react-router-dom";

import UpdateLauncher from "screens/updateLauncher";
import Auth from "screens/auth";
import Launcher from "screens/launcher";

declare global {
    interface Window {
        ipc: {
            send: (channel: string, data?: any) => void;
            sendSync: (channel: string, data?: any) => any;
            receive: (channel: string, func: (event: any, ...args: any[]) => void) => void;
        },
        store: {
            set: (key: string, value: any) => void;
            get: (key: string) => any;
        },
        os: {
            totalmem: () => number;
        }
    }
}

const container = document.getElementById("root");
const root = createRoot(container!);

root.render(
    <React.StrictMode>
        <div id="titlebarRegion" className="titlebarRegion"></div>
        <HashRouter>
            <Routes>
                <Route path="/" element={<UpdateLauncher/>} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/launcher" element={<Launcher />} />
            </Routes>
        </HashRouter>
        <script src="../public/scripts/toast"></script>
    </React.StrictMode>
)
