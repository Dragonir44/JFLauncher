import { Component } from "react";
import { NavigateFunction } from "react-router-dom";
import { WithTranslation, withTranslation } from "react-i18next"
import "i18n"
import { withRouter } from "utils/withRouter";

type Props = {
    navigate?: NavigateFunction;
}

interface InputChange {
    currentRam?: number;
    windowWidth?: number;
    windowHeight?: number;
    fullscreen?: boolean;
    autoConnect?: boolean;
    serverAddress?: string;
    serverPort?: string;
    selectedChannel?: any;
}

const maxRam = window.os.totalmem() / 1024 / 1024 / 1024;

class OptionsModal extends Component<Props & WithTranslation, InputChange> {
    state = {
        currentRam: 1,
        windowWidth: 800,
        windowHeight: 600,
        fullscreen: false,
        autoConnect: false,
        serverAddress: "",
        serverPort: "",
        selectedChannel: {value: "beta", label: "Beta"}
    }

    async componentDidMount() {
        const ramRange = document.getElementById("ram") as HTMLInputElement
        const ramValue = document.getElementById("ramValue") as HTMLInputElement
        const width = document.getElementById("window-width") as HTMLInputElement
        const height = document.getElementById("window-height") as HTMLInputElement
        const fullscreen = document.getElementById("fullscreen") as HTMLInputElement
        const autoConnect = document.getElementById("autoConnect") as HTMLInputElement
        const serverAddress = document.getElementById("server-address") as HTMLInputElement
        const serverPort = document.getElementById("server-port") as HTMLInputElement
        const savedRam = await window.store.get("ram")
        const savedWidth = await window.store.get("windowWidth")
        const savedHeight = await window.store.get("windowHeight")
        const savedFullscreen = await window.store.get("fullscreen")
        const savedChannel = await window.store.get("channel") || {value: "beta", label: "Beta"}

        ramRange.value = savedRam != Math.round(maxRam/2) ? savedRam : "1"
        ramValue.value = savedRam != Math.round(maxRam/2) ? savedRam : 1
        this.setState({currentRam: Number(savedRam != 'undefined' ? savedRam : 1)})

        width.value = savedWidth != 'undefined' ? savedWidth : 800
        this.setState({windowWidth: Number(savedWidth != 'undefined' ? savedWidth : 800)})

        height.value = savedHeight != 'undefined' ? savedHeight : 600
        this.setState({windowHeight: Number(savedHeight != 'undefined' ? savedHeight : 600)})

        fullscreen.checked = savedFullscreen != 'undefined' ? savedFullscreen : false
        this.setState({fullscreen: savedFullscreen != 'undefined' ? savedFullscreen : false})

        autoConnect.checked = await window.store.get("autoConnect") || false
        this.setState({autoConnect: await window.store.get("autoConnect") || false})

        serverAddress.value = await window.store.get("serverAddress") || ""
        this.setState({serverAddress: await window.store.get("serverAddress") || ""})

        serverPort.value = await window.store.get("serverPort") || ""
        this.setState({serverPort: await window.store.get("serverPort") || ""})

        if (!autoConnect.checked) {
            serverAddress.disabled = true
            serverPort.disabled = true
        }
        
        this.setState({selectedChannel: savedChannel})
    
        window.ipc.receive('updateChannel', async () => {
            this.setState({selectedChannel: await window.store.get('channel')})
        })
    }

    handleRam = (e: any) => {
        const ram = e.currentTarget as HTMLInputElement
        const ramValue = document.getElementById("ramValue") as HTMLInputElement
        console.log(ram.className)
        if (ram.className === "ramRange") {
            ramValue.value = ram.value
        }
        
        if (ram.className === "ramValue") {
            ramValue.value = ram.value
        }

        this.setState({currentRam: Number(ram.value)})
        window.store.set("ram", ram.value)
    }

    handleSize = (e: any) => {
        const size = e.currentTarget as HTMLInputElement

        if (size.id === "window-width") {
            this.setState({windowWidth: Number(size.value)})
            window.store.set("windowWidth", size.value)
        }

        if (size.id === "window-height") {
            this.setState({windowHeight: Number(size.value)})
            window.store.set("windowHeight", size.value)
        }
    }

    handleFullscreen = (e: any) => {
        const fullscreen = e.currentTarget as HTMLInputElement
        this.setState({fullscreen: fullscreen.checked})
        window.store.set("fullscreen", fullscreen.checked)
    }

    handleAutoConnect = (e: any) => {
        const autoConnect = e.currentTarget as HTMLInputElement
        this.setState({autoConnect: autoConnect.checked})
        window.store.set("autoConnect", autoConnect.checked)
        const serverAddress = document.getElementById("server-address") as HTMLInputElement
        const serverPort = document.getElementById("server-port") as HTMLInputElement
        serverAddress.disabled = !autoConnect.checked
        serverPort.disabled = !autoConnect.checked
    }

    handleUpdateServerAddress = (e: any) => {
        const serverAddress = e.currentTarget as HTMLInputElement
        window.store.set("serverAddress", serverAddress.value)
    }

    handleUpdateServerPort = (e: any) => {
        const serverPort = e.currentTarget as HTMLInputElement
        window.store.set("serverPort", serverPort.value)
    }

    handleDisconnect = (e: any) => {
        e.currentTarget.disabled = true;
        this.props.navigate!("/auth")
    }

    handleReinstall = (e: any) => {
        const progressBar = document.getElementById("progressBar") as HTMLDivElement
        const selectChannel = document.getElementById("channel") as HTMLSelectElement
        const modal = document.getElementById("myModal");
        modal!.style.display = "none";
        selectChannel.disabled = true;
        selectChannel.style.display = 'none';
        progressBar.style.display = 'block'
        e.currentTarget.disabled = true;
        window.ipc.send("reinstall", {channel: this.state.selectedChannel.value});
    }

    displayModal = () => {
        const modal = document.getElementById("options") as HTMLDivElement
        modal!.classList.toggle("active")
    }

    render() {
        const {currentRam, selectedChannel} = this.state
        const {t} = this.props
        return (
            <div id="options" className="options">
                <div id="options--button" className="options--button" onClick={this.displayModal}></div>
                <div id="optionModal" className="optionModal">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>{t('launcher.settings-label')}</h2>
                        </div>
                        <div className="modal-body">
                            <div className="block ram">
                                <b>{t('launcher.settings.ram')}</b>
                                <input className="ramRange" id="ram" type="range" min="1" value={currentRam} max={maxRam} onInput={this.handleRam} />
                                <input type="number" name="ramValue" id="ramValue" onInput={this.handleRam}/>Go
                            </div>
                            <hr />
                            <div className="block size">
                                <div className="window-size">
                                    <b>{t('launcher.settings.window-size')}</b>
                                    <input type="number" name="window-width" id="window-width" onInput={this.handleSize}/>
                                    <input type="number" name="window-height" id="window-height" onInput={this.handleSize}/>
                                </div>
                                <div className="fullscreen">
                                    <b>{t('launcher.settings.window-fullscreen')}</b>
                                    <input type="checkbox" id="fullscreen" onChange={this.handleFullscreen} />
                                </div>
                            </div>
                            <hr />
                            <div className="block auto-connect">
                                <div className="auto-connect-box">
                                    <b>{t('launcher.settings.auto-connect')}</b>
                                    <input type="checkbox" id="autoConnect" onChange={this.handleAutoConnect} />
                                </div>
                                <div className="auto-connect-block">
                                    <input type="text" name="server-address" id="server-address" placeholder={t('launcher.settings.server-ip')} onChange={this.handleUpdateServerAddress}/>:
                                    <input type="number" name="server-port" id="server-port" placeholder={t('launcher.settings.server-port')} onChange={this.handleUpdateServerPort}/>
                                </div>
                            </div>
                            <hr />
                            <div className="block functionButtons">
                                <button id="showFolder" className="functionButton" onClick={() => window.ipc.send("showFolder", {})}>{t('launcher.settings.open-folder')}</button>
                                <button id="reinstall" className="functionButton" onClick={this.handleReinstall}>{t("launcher.settings.reinstall-channel", {channel: selectedChannel.label})}</button>
                                <button id="deco" className="functionButton" onClick={this.handleDisconnect}>{t('launcher.settings.change-account')}</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

export default withTranslation()(withRouter<Props & WithTranslation>(OptionsModal))