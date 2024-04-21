import { Component, version } from "react";
import { NavigateFunction } from "react-router-dom";
import { WithTranslation, withTranslation } from "react-i18next"
import Select, { StylesConfig } from "react-select";
import Swal from "sweetalert2";
import withReactContent from 'sweetalert2-react-content'
import "i18n"
import { withRouter } from "utils/withRouter";


const MySwal = withReactContent(Swal)
const navLang: string = navigator.language.split("-")[0]

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
    selectedVersion?: any;
    options?: any[];
    versions?: any[];
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
        versions: [],
        serverAddress: "",
        serverPort: "",
        selectedChannel: {value: "release", label: "Release"},
        selectedVersion: {value: "latest", label: "Latest", changelogs: {en: "", fr: ""}}
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
        const defaultChannel = await window.store.get("channel")
        let options: any[] = []
        let versions: any[] = []


        window.ipc.send("getChannelsFromServer")

        window.ipc.receive('getChannelsFromServer-complete', (res) => {
            window.store.set("channels", res)
            if (options.length === 0) {
                for(const channel of res) {
                    options.push({
                        value: channel.name,
                        label: channel.name.charAt(0).toUpperCase()+channel.name.slice(1),
                    })
                }
                this.setState({options: options})
            }

            if (defaultChannel && versions.length === 0) {
                for (const channel of res) {
                    if (channel.name === defaultChannel.channel.value) {
                        // sort versions in descending order but keep the latest version at the top
                        versions = channel.versions.sort((a: any, b: any) => {
                            if (a.Version === "latest") return -1
                            if (b.Version === "latest") return 1
                            return b.Version.localeCompare(a.version)
                        })

                        versions = versions.map((version: any) => {
                            return {
                                value: version.Version,
                                label: version.Version === "latest" ? t("launcher.settings.versions.latest") : version.Version,
                                changelogs: version.Changelog,
                                forgeVersion: version.ForgeVersion,
                                versionFile: version.Path.split("/").pop().split(".zip")[0]
                            }
                        })
                        console.log(versions)
                    }
                }
                this.setState({versions: versions, selectedVersion: versions[0]})
            }

            this.setState({selectedChannel: defaultChannel.channel || {value: "release", label: "Release"}, selectedVersion: defaultChannel.version != undefined ? defaultChannel.version : versions[0]})
        })

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

        window.ipc.receive('reset-complete', () => {
            MySwal.fire({
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
        window.ipc.send("reinstall", {channel: this.state.selectedChannel.value, version: this.state.selectedVersion});
    }

    handleChannel = async (e: any) => {
        const {t} = this.props
        const channels = await window.store.get("channels")
        let versions: any[] = []

        for (const channel of channels) {
            if (channel.name === e.value) {
                console.log(channel.versions)
                versions = channel.versions.sort((a: any, b: any) => {
                    if (a.Version === "latest") return -1
                    if (b.Version === "latest") return 1
                    return b.Version.localeCompare(a.Version)
                })
                console.log(versions)
                versions = versions.map((version: any) => {
                    return {
                        value: version.Version,
                        label: version.Version === "latest" ? t("launcher.settings.versions.latest") : version.version,
                        changelogs: version.Changelog,
                        forgeVersion: version.ForgeVersion,
                        versionFile: version.Path.split("/").pop().split(".zip")[0]
                    }
                })
            }
        }
        this.setState({selectedChannel: e, selectedVersion: versions[0], versions: versions})
        window.store.set('channel', {channel: e, version: versions[0]})
    }

    handleVersion = (e: any) => {
        this.setState({selectedChannel: this.state.selectedChannel, selectedVersion: e})
        window.store.set('channel', {channel: this.state.selectedChannel, version: e})
    }

    handleChangelogs = () => {
        const {t} = this.props
        const changelogs: { en: string; fr: string; } = this.state.selectedVersion.changelogs
        MySwal.fire({
            title: t("launcher.settings.changelogs"),
            html: changelogs[navLang as keyof typeof changelogs],
            confirmButtonText: "Fermer",
            background: "#1e1e1e",
            color: "#fff"
        })
    }

    handleReset = () => {
        window.ipc.send("reset")
    }

    displayModal = () => {
        const modal = document.getElementById("options") as HTMLDivElement
        modal!.classList.toggle("active")
    }

    render() {
        const {currentRam, selectedChannel, selectedVersion, options, versions} = this.state
        const {t} = this.props
        return (
            <div id="options" className="options">
                <div id="options--button" className="options--button" onClick={this.displayModal}><div className="options--button__burger"></div></div>
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
                            <div className="block versions">
                                <div className="versions--block">
                                    <label htmlFor="channel">{t('launcher.settings.versions.channel')}</label>
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
                                </div>
                                <div className="versions--block">
                                    <label htmlFor="version">{t('launcher.settings.versions.version')}</label>
                                    <Select 
                                        name="version" 
                                        id="version"
                                        classNamePrefix="version"
                                        value={selectedVersion}
                                        isSearchable={false}
                                        options={versions} 
                                        styles={customStyles}
                                        menuPlacement="top"
                                        onChange={this.handleVersion}
                                    />
                                </div>
                            </div>
                            <hr />
                            <div className="block functionButtons">
                                <button id="showFolder" className="functionButton" onClick={() => window.ipc.send("showFolder", {})}>{t('launcher.settings.open-folder')}</button>
                                <button id="showChangelogs" className="functionButton" onClick={this.handleChangelogs}>{t("launcher.settings.changelogs")}</button>
                                <button id="reinstall" className="functionButton" onClick={this.handleReinstall}>{t("launcher.settings.reinstall-channel", {channel: selectedVersion.label})}</button>
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