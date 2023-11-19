import { Component, useState } from "react";
import { withRouter } from "utils/withRouter";
import { NavigateFunction } from "react-router-dom";
import { LinearProgress } from "@mui/material";

import '../css/launcher.css';


const maxRam = window.os.totalmem() / 1024 / 1024 / 1024;


type Props = {
    navigate?: NavigateFunction;
}

interface InputChange {
    currentRam?: number;
    progress?: number;
    updateText?: string;
}

class Launcher extends Component<Props, InputChange> {

    // constructor(props: Props) {
    //     super(props);
        
    // }
    state = {
        currentRam: 1,
        progress: 0,
        updateText: ""
    }

    async componentDidMount() {
        const userDetails = JSON.parse(await window.ipc.sendSync("getDetails"))
        const versionNumber = await window.ipc.sendSync("getVersion")
        const playbtn = document.getElementById("playbtn") as HTMLButtonElement
        const pseudo = document.getElementById("pseudo") as HTMLSpanElement
        const skin = document.getElementById("skin") as HTMLImageElement
        const version = document.getElementById("version") as HTMLSpanElement
        const ram = document.getElementById("ram") as HTMLInputElement
        const ramValue = document.getElementById("ramValue") as HTMLSpanElement
        const savedRam = await window.store.get("ram")

        pseudo.innerHTML = userDetails.profile.name
        skin.src = `https://mc-heads.net/avatar/${userDetails.profile.name}`
        version.innerHTML = versionNumber
        this.setState({
            currentRam: Number(savedRam || "1")
        })
        ramValue.innerHTML = savedRam || "1"
        this.setState({updateText: "Recherche de maj..."})

        window.ipc.receive('updateText', (data) => {
            const {progress} = this.state
            this.setState({updateText: `${data} : ${progress}%`})
        })

        window.ipc.receive('updateProgress', (data) => {
            this.setState({progress: data})
        })

        window.ipc.receive('closed', (event, data) => {
            const progressBar = document.getElementById("progressBar") as HTMLDivElement
            const progress = document.getElementById("progress") as HTMLDivElement
            playbtn.disabled = false;
            progressBar.style.display = 'none'
            progress.style.width = '0%'
        })

        window.ipc.receive('message', function(event, text) {
            const container = document.getElementById('messages') as HTMLDivElement;
            const message = document.createElement('div');
            console.log(text)
            message.innerHTML = text;
            container.appendChild(message);
        })
    }

    handlePlay = (e: any) => {
        const ram = document.getElementById("ram") as HTMLInputElement
        const progressBar = document.getElementById("progressBar") as HTMLDivElement
        progressBar.style.display = 'block'
        e.currentTarget.disabled = true;
        window.ipc.send("launch", {ram: ram?.value, channel: 'beta'});
    }
    
    displayModal = (e: any) => {
        const modal = document.getElementById("myModal");
        modal!.style.display = "block";
    }
    
    handleRam = (e: any) => {
        const ram = e.currentTarget as HTMLInputElement
        const ramValue = document.getElementById("ramValue") as HTMLSpanElement
        ramValue.innerHTML = ram.value

        this.setState({
            currentRam: Number(ram.value)
        })
        window.store.set("ram", ram.value)
    }

    handleDisconnect = (e: any) => {
        e.currentTarget.disabled = true;
        window.ipc.send("deco", {})
        this.props.navigate!("/")
    }
    
    handleCloseOptions = (e: any) => {
        const modal = document.getElementById("myModal");
        modal!.style.display = "none";
    }

    render() {
        const { progress, updateText } = this.state;
        return (
            <>
                <header>
                    Current version: <span id="version">vX.Y.Z</span>
                    <div id="messages"></div>
                </header>
                <div id="myModal" className="modal">
                    <div className="modal-content">
                        <div className="modal-header">
                            <span className="close" onClick={this.handleCloseOptions}>&times;</span>
                            <h2>Options</h2>
                        </div>
                        <div className="modal-body">
                            <b>Mémoire vive :</b>
                            <input type="range" min="1" value={this.state.currentRam} id="ram" max={maxRam} onInput={this.handleRam} />
                            <span id="ramValue">1</span>
                            GO
                            <hr />
                            <button id="deco" className="launchButton" onClick={this.handleDisconnect}>Déconnexion</button>
                        </div>
                    </div>
                </div>
                <section id="news">
                    <img src="https://minotar.net/avatar/MHF_Steve/100.png" id="skin" /><br />
                    Bienvenue <b id="pseudo">Inconnu</b>
                </section>
                <footer>
                    <button id="options" className="launchButton" onClick={this.displayModal}>OPTIONS</button>
                    <div id="progressBar" className="progressBar">
                        <span id="status" className="status">{updateText}</span>
                        <LinearProgress
                            variant={progress == 0 ? "indeterminate" : "determinate"}
                            value={progress}
                        />
                    </div>
                    <button id="playbtn" className="launchButton" onClick={this.handlePlay}>JOUER</button>
                </footer>
                <script src="../public/scripts/main.js"></script>
            </>
        )
    }
}

export default withRouter<Props>(Launcher);