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
    selectedChannel?: any;
}

const maxRam = window.os.totalmem() / 1024 / 1024 / 1024;

class OptionsModal extends Component<Props & WithTranslation, InputChange> {
    state = {
        currentRam: 1,
        selectedChannel: {value: "beta", label: "Beta"}
    }

    async componentDidMount() {
        const ramValue = document.getElementById("ramValue") as HTMLSpanElement
        const savedRam = await window.store.get("ram")
        const savedChannel = await window.store.get("channel") || {value: "beta", label: "Beta"}

        ramValue.innerHTML = savedRam != 'undefined' ? `${savedRam}Go` : "1Go"

        this.setState({currentRam: Number(savedRam != 'undefined' ? savedRam : "1")})
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
                            <h2>{t('launcher.settings')}</h2>
                        </div>
                        <div className="modal-body">
                            <div className="ram-block">
                                <b>{t('launcher.ram')}</b>
                                <input className="ramRange" type="range" min="1" value={currentRam} id="ram" max={maxRam} onInput={this.handleRam} />
                                <span id="ramValue">1Go</span>
                            </div>
                            <hr />
                            <div className="functionButtons">
                                <button id="showFolder" className="launchButton" onClick={() => window.ipc.send("showFolder", {})}>{t('launcher.open-folder')}</button>
                                <button id="reinstall" className="launchButton" onClick={this.handleReinstall}>{t("launcher.reinstall-channel", {channel: selectedChannel.label})}</button>
                            </div>
                            <hr />
                            <button id="deco" className="launchButton" onClick={this.handleDisconnect}>{t('launcher.change-account')}</button>
                        </div>
                    </div>
                </div>
            </>
        )
    }
}

export default withTranslation()(withRouter<Props & WithTranslation>(OptionsModal))