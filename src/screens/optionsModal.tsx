import { Component } from "react";
import { NavigateFunction } from "react-router-dom";
import { WithTranslation, withTranslation } from "react-i18next"
import Select, { StylesConfig } from "react-select";
import Swal from "sweetalert2";
import "i18n"
import { withRouter } from "utils/withRouter";

const customStyles: StylesConfig = {
    dropdownIndicator: (provided:any, state:any) => ({
        ...provided,
        transform: state.selectProps.menuIsOpen && 'rotate(180deg)',
        color: state.selectProps.menuIsOpen && '#fff'
    }),
    menu: (provided:any, state:any) => ({
        ...provided,
        backgroundColor: '#727272a8',
        color: '#fff',
        borderRadius: '0',
        zIndex: 10
    }),
    option: (styles, {data, isDisabled, isFocused, isSelected}) => ({
        ...styles,
        color: isDisabled ? '#ccc' : '#fff',
        backgroundColor: isDisabled ? 'grey' : isSelected ? '#000' : undefined,
        ":hover" : {
            ...styles[":active"],
            backgroundColor: isDisabled ? "grey" : "#fff",
            color: "#000"
        }
    }),
    control: (provided:any, state:any) => ({
        ...provided,
        background: "rgba(0, 0, 0, 0.115)",
        cursor: "pointer",
        border: "1px solid #000",
    }),
    valueContainer: (provided:any, state:any) => ({
        ...provided,
        color: "#fff"
    }),
    singleValue: (provided:any, state:any) => ({
        ...provided,
        color: "#fff"
    }),
}

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
    options?: any[];
}

const maxRam = window.os.totalmem() / 1024 / 1024 / 1024;

class OptionsModal extends Component<Props & WithTranslation, InputChange> {
    state = {
        currentRam: 1,
        windowWidth: 800,
        windowHeight: 600,
        fullscreen: false,
        autoConnect: false,
        options: [],
        serverAddress: "",
        serverPort: "",
        selectedChannel: {value: "beta", label: "Beta"}
    }

    async componentDidMount() {
        const {t} = this.props
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
        const channels = await window.ipc.sendSync("getChannels")
        const defaultChannel = await window.store.get("channel")
        let options: any[] = []

        
        for(let i = 0; i < channels.length; i++) {
            const channel = channels[i]
            if (!options.includes(channel)) {
                options.push({
                    value: channel.channel_name, 
                    label: channel.channel_name.charAt(0).toUpperCase()+channel.channel_name.slice(1),
                    isDisabled: !channel.download_link
                })
            }
            if (defaultChannel && defaultChannel.value === channel.channel_name) {
                this.setState({
                    selectedChannel: {
                        value: channel.channel_name, 
                        label: channel.channel_name.charAt(0).toUpperCase()+channel.channel_name.slice(1)
                    }
                })
                window.store.set('channel', this.state.selectedChannel)
                window.ipc.send("updateChannel")
            }
        }

        ramRange.value = savedRam || Math.round(maxRam/2)
        ramValue.value = savedRam || Math.round(maxRam/2)
        this.setState({currentRam: Number(savedRam || Math.round(maxRam/2))})

        width.value = savedWidth || 800
        this.setState({windowWidth: Number(savedWidth || 800)})

        height.value = savedHeight || 600
        this.setState({windowHeight: Number(savedHeight || 600)})

        fullscreen.checked = savedFullscreen != 'undefined' ? savedFullscreen : false
        this.setState({fullscreen: savedFullscreen != 'undefined' ? savedFullscreen : false})

        autoConnect.checked = await window.store.get("autoConnect") || false
        this.setState({autoConnect: await window.store.get("autoConnect") || false})

        serverAddress.value = await window.store.get("serverAddress") || "0.0.0.0"
        this.setState({serverAddress: await window.store.get("serverAddress") || "0.0.0.0"})

        serverPort.value = await window.store.get("serverPort") || 25565
        this.setState({serverPort: await window.store.get("serverPort") || 25565})

        this.setState({options: options})

        if (!autoConnect.checked) {
            serverAddress.disabled = true
            serverPort.disabled = true
        }
        
        this.setState({selectedChannel: savedChannel || {value: "beta", label: "Beta"}})
    
        window.ipc.receive('updateChannel', async () => {
            this.setState({selectedChannel: await window.store.get('channel')})
        })

        window.ipc.receive('reset-complete', () => {
            Swal.fire({
                title: t("launcher.settings.reset-complete-title"),
                text: t("launcher.settings.reset-complete-text"),
                icon: "success",
                iconColor: "#54c2f0",
                confirmButtonText: "Fermer",
                background: "#1e1e1e",
                confirmButtonColor: "#54c2f0"
            }).then((result) => {
                if (result.isConfirmed) {
                    window.ipc.send("confirm-reset")
                }
            })
        
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
        const option = document.getElementById("options") as HTMLDivElement

        option.classList.remove("active");

        selectChannel.disabled = true;
        selectChannel.style.display = 'none';

        progressBar.style.display = 'block'

        e.currentTarget.disabled = true;
        window.ipc.send("reinstall", {channel: this.state.selectedChannel.value});
    }

    handleChannel = (e: any) => {
        this.setState({selectedChannel: e})
        window.store.set('channel', e)
        window.ipc.send("updateChannel")
    }

    handleReset = () => {
        window.ipc.send("reset")
    }

    displayModal = () => {
        const modal = document.getElementById("options") as HTMLDivElement
        modal!.classList.toggle("active")
    }

    render() {
        const {currentRam, selectedChannel, options} = this.state
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
                                <Select 
                                    name="channel" 
                                    id="channel"
                                    classNamePrefix="channel"
                                    value={selectedChannel}
                                    isSearchable={false}
                                    options={options} 
                                    styles={customStyles}
                                    menuPlacement="top"
                                    onChange={this.handleChannel}
                                />
                                <button id="showFolder" className="functionButton" onClick={() => window.ipc.send("showFolder", {})}>{t('launcher.settings.open-folder')}</button>
                                <button id="reinstall" className="functionButton" onClick={this.handleReinstall}>{t("launcher.settings.reinstall-channel", {channel: selectedChannel.label})}</button>
                                <button id="deco" className="functionButton" onClick={this.handleDisconnect}>{t('launcher.settings.change-account')}</button>
                            </div>
                            <div className="block danger">
                                <button id="resetLauncher" className="functionButton" onClick={this.handleReset}>{t("launcher.settings.reset")}</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

export default withTranslation()(withRouter<Props & WithTranslation>(OptionsModal))