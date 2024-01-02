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
        const ramValue = document.getElementById("ramValue") as HTMLSpanElement
        const width = document.getElementById("windowWidth") as HTMLInputElement
        const widthValue = document.getElementById("windowWidthValue") as HTMLSpanElement
        const height = document.getElementById("windowHeight") as HTMLInputElement
        const heightValue = document.getElementById("windowHeightValue") as HTMLSpanElement
        const fullscreen = document.getElementById("fullscreen") as HTMLInputElement
        const autoConnect = document.getElementById("autoConnect") as HTMLInputElement
        const serverAddress = document.getElementById("server-address") as HTMLInputElement
        const serverPort = document.getElementById("server-port") as HTMLInputElement
        const savedRam = await window.store.get("ram")
        const savedWidth = await window.store.get("windowWidth")
        const savedHeight = await window.store.get("windowHeight")
        const savedFullscreen = await window.store.get("fullscreen")
        const savedChannel = await window.store.get("channel") || {value: "beta", label: "Beta"}

        ramRange.value = savedRam != 'undefined' ? savedRam : "1"
        ramValue.innerHTML = savedRam != 'undefined' ? `${savedRam}Go` : "1Go"
        this.setState({currentRam: Number(savedRam != 'undefined' ? savedRam : 1)})

        width.value = savedWidth != 'undefined' ? savedWidth : "800"
        widthValue.innerHTML = savedWidth != 'undefined' ? `${savedWidth}px` : "800px"
        this.setState({windowWidth: Number(savedWidth != 'undefined' ? savedWidth : 800)})

        height.value = savedHeight != 'undefined' ? savedHeight : "600"
        heightValue.innerHTML = savedHeight != 'undefined' ? `${savedHeight}px` : "600px"
        this.setState({windowHeight: Number(savedHeight != 'undefined' ? savedHeight : 600)})

        fullscreen.checked = savedFullscreen != 'undefined' ? savedFullscreen : false
        this.setState({fullscreen: savedFullscreen != 'undefined' ? savedFullscreen : false})

        autoConnect.checked = await window.store.get("autoConnect") || false
        this.setState({autoConnect: await window.store.get("autoConnect") || false})

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
        const ramValue = document.getElementById("ramValue") as HTMLSpanElement
        ramValue.innerHTML = `${ram.value}Go`

        this.setState({currentRam: Number(ram.value)})
        window.store.set("ram", ram.value)
    }

    handleWidth = (e: any) => {
        const width = e.currentTarget as HTMLInputElement
        const widthValue = document.getElementById("windowWidthValue") as HTMLSpanElement
        widthValue.innerHTML = `${width.value}px`

        this.setState({windowWidth: Number(width.value)})
        window.store.set("windowWidth", width.value)
    }

    handleHeight = (e: any) => {
        const height = e.currentTarget as HTMLInputElement
        const heightValue = document.getElementById("windowHeightValue") as HTMLSpanElement
        heightValue.innerHTML = `${height.value}px`

        this.setState({windowHeight: Number(height.value)})
        window.store.set("windowHeight", height.value)
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

    handleCloseOptions = (e: any) => {
        const modal = document.getElementById("myModal");
        modal!.style.display = "none";
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

    render() {
        const {currentRam, selectedChannel} = this.state
        const {t} = this.props
        return (
            <>
                <div id="myModal" className="modal">
                    <div className="modal-content">
                        <div className="modal-header">
                            <span className="close" onClick={this.handleCloseOptions}>&times;</span>
                            <h2>{t('launcher.settings-label')}</h2>
                        </div>
                        <div className="modal-body">
                            <div className="ram-block">
                                <b>{t('launcher.settings.ram')}</b>
                                <input className="ramRange" id="ram" type="range" min="1" value={currentRam} max={maxRam} onInput={this.handleRam} />
                                <span id="ramValue">1Go</span>
                            </div>
                            <hr />
                            <div className="windowBlock">
                                <div className="width">
                                    <b>{t('launcher.settings.window-width')}</b>
                                    <input className="windowRange" id="windowWidth"  type="range" min="800" defaultValue="800" max={window.screen.availWidth} onChange={this.handleWidth} />
                                    <span id="windowWidthValue">800px</span>
                                </div>

                                <div className="height">
                                    <b>{t('launcher.settings.window-height')}</b>
                                    <input className="windowRange" id="windowHeight" type="range" min="600" defaultValue="600" max={window.screen.availHeight} onChange={this.handleHeight} />
                                    <span id="windowHeightValue">600px</span>
                                </div>

                                <div className="fullscreen">
                                    <b>{t('launcher.settings.window-fullscreen')}</b>
                                    <input type="checkbox" id="fullscreen" onChange={this.handleFullscreen} />
                                </div>
                            </div>
                            <hr />
                            <div className="auto-connect">
                                <b>{t('launcher.settings.auto-connect')}</b>
                                <input type="checkbox" id="autoConnect" onChange={this.handleAutoConnect} />
                                <div className="auto-connect-block">
                                    <input type="text" name="server-address" id="server-address" placeholder={t('launcher.settings.server-ip')} onChange={this.handleUpdateServerAddress}/>:
                                    <input type="number" name="server-port" id="server-port" placeholder={t('launcher.settings.server-port')} onChange={this.handleUpdateServerPort}/>
                                </div>
                            </div>
                            <hr />
                            <div className="functionButtons">
                                <button id="showFolder" className="launchButton" onClick={() => window.ipc.send("showFolder", {})}>{t('launcher.settings.open-folder')}</button>
                                <button id="reinstall" className="launchButton" onClick={this.handleReinstall}>{t("launcher.settings.reinstall-channel", {channel: selectedChannel.label})}</button>
                            </div>
                            <hr />
                            <button id="deco" className="launchButton" onClick={this.handleDisconnect}>{t('launcher.settings.change-account')}</button>
                        </div>
                    </div>
                </div>
            </>
        )
    }
}

export default withTranslation()(withRouter<Props & WithTranslation>(OptionsModal))