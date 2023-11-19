import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Auth from "screens/auth";
import Launcher from "screens/launcher";

import 'css/toast.css'

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
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Auth />} />
                <Route path="/launcher" element={<Launcher />} />
            </Routes>
        </BrowserRouter>
        <script src="../public/scripts/toast"></script>
    </React.StrictMode>
)