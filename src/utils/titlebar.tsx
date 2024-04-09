import { Component } from "react";

import "scss/titlebar.scss"


const version = window.ipc.sendSync("load");

class TitleBar extends Component {
    handleMinimize = () => {
        window.ipc.send("minimize");
    }
    handleMaximize = () => {
        window.ipc.send("maximize");
    }
    handleClose = () => {
        window.ipc.send("quit-app");
    }
    render() {
        return (
            <div id="titlebarRegion" className="titlebarRegion">
                <div className="topbar">
                    <img src="assets/logo.png" alt="" className="icon" />
                    <div id="titlebar-drag-region" className="titlebar-drag-region"></div>
                    <div id="titlebar-title" className="titlebar-title">JFLauncher - {version}</div>
                </div>
                <div id="titlebar-buttons" className="titlebar-buttons">
                    <button id="titlebar-minimize" className="titlebar-button titlebar-minimize" onClick={this.handleMinimize}></button>
                    <button id="titlebar-maximize" className="titlebar-button titlebar-maximize" onClick={this.handleMaximize}></button>
                    <button id="titlebar-close" className="titlebar-button titlebar-close" onClick={this.handleClose}></button>
                </div>
            </div>
        )
    }
}

export default TitleBar;