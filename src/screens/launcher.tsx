import { Component } from "react";
import { withRouter } from "utils/withRouter";
import { NavigateFunction } from "react-router-dom";
import Select, { StylesConfig } from "react-select";

import 'scss/launcher.scss';


const maxRam = window.os.totalmem() / 1024 / 1024 / 1024;


type Props = {
    navigate?: NavigateFunction;
}

interface InputChange {
    currentRam?: number;
    progress?: number;
    updateText?: string;
    channels?: string[];
    selectedChannel?: any;
    options?: any[];
    news?: any;
}

const customStyles: StylesConfig = {
    dropdownIndicator: (provided:any, state:any) => ({
        ...provided,
        transform: state.selectProps.menuIsOpen && 'rotate(180deg)',
        color: state.selectProps.menuIsOpen && '#fff'
    })
}

class Launcher extends Component<Props, InputChange> {

    constructor(props: Props) {
        super(props);

        this.state = {
            currentRam: 1,
            progress: 0,
            updateText: "",
            options: [],
            selectedChannel: {value: "beta", label: "Beta"},
            news: []
        }
    }
    async componentDidMount() {
        const userDetails = JSON.parse(await window.ipc.sendSync("getDetails"))
        const pseudo = document.getElementById("pseudo") as HTMLSpanElement
        const skin = document.getElementById("skin") as HTMLImageElement
        const ramValue = document.getElementById("ramValue") as HTMLSpanElement
        const savedRam = await window.store.get("ram")
        const channels = await window.ipc.sendSync("getChannels")
        const defaultChannel = await window.store.get("channel")
        const {news} = await window.store.get("config")
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
            }
        }
        this.setState({options: options})

        this.setState({news: news})

        pseudo.innerHTML = userDetails.profile.name
        skin.src = `https://mc-heads.net/avatar/${userDetails.profile.name}`
        this.setState({
            currentRam: Number(savedRam || "1")
        })
        ramValue.innerHTML = `${savedRam}Go` || "1Go"
        this.setState({updateText: "Recherche de maj..."})

        window.ipc.receive('updateText', (data) => {
            this.setState({updateText:`${data} : ${this.state.progress}%`})
        })

        window.ipc.receive('updateProgress', (data) => {
            this.setState({progress: data})
        })

        window.ipc.receive('closed', (event, data) => {
            const progressBar = document.getElementById("progressBar") as HTMLDivElement
            const playbtn = document.getElementById("playbtn") as HTMLButtonElement
            const selectChannel = document.getElementById("channel") as HTMLSelectElement
            selectChannel.disabled = false;
            selectChannel.style.display = 'block';
            progressBar.style.display = 'none'
            playbtn.disabled = false;
            this.setState({updateText: "", progress: 0})
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
        const selectChannel = document.getElementById("channel") as HTMLSelectElement
        selectChannel.disabled = true;
        selectChannel.style.display = 'none';
        progressBar.style.display = 'block'
        e.currentTarget.disabled = true;
        window.ipc.send("launch", {ram: ram?.value, channel: this.state.selectedChannel.value});
    }

    handleChannel = (e: any) => {
        this.setState({selectedChannel: e})
        window.store.set('channel', e)
    }
    
    displayModal = (e: any) => {
        const modal = document.getElementById("myModal");
        modal!.style.display = "block";
    }
    
    handleRam = (e: any) => {
        const ram = e.currentTarget as HTMLInputElement
        const ramValue = document.getElementById("ramValue") as HTMLSpanElement
        ramValue.innerHTML = `${ram.value}Go`

        this.setState({
            currentRam: Number(ram.value)
        })
        window.store.set("ram", ram.value)
    }

    handleDisconnect = (e: any) => {
        e.currentTarget.disabled = true;
        // window.ipc.send("deco", {})
        this.props.navigate!("/auth")
    }
    
    handleCloseOptions = (e: any) => {
        const modal = document.getElementById("myModal");
        modal!.style.display = "none";
    }

    render() {
        const { progress, updateText, options, currentRam, selectedChannel, news } = this.state
        return (
            <>
                <header>
                    <div id="messages"></div>
                </header>
                <div id="myModal" className="modal">
                    <div className="modal-content">
                        <div className="modal-header">
                            <span className="close" onClick={this.handleCloseOptions}>&times;</span>
                            <h2>Options</h2>
                        </div>
                        <div className="modal-body">
                            <div className="ram-block">
                                <b>Mémoire vive</b>
                                <input className="ramRange" type="range" min="1" value={currentRam} id="ram" max={maxRam} onInput={this.handleRam} />
                                <span id="ramValue">1Go</span>
                            </div>
                            <hr />
                            <div className="showFolder">
                                <button id="showFolder" className="launchButton" onClick={() => window.ipc.send("showFolder", {})}>Ouvrir le dossier</button>
                            </div>
                            <hr />
                            <button id="deco" className="launchButton" onClick={this.handleDisconnect}>Déconnexion</button>
                        </div>
                    </div>
                </div>
                <div id="middle" className="middle">
                    <div className="userInfo">
                        <h3>Bienvenue <b id="pseudo">Inconnu</b></h3>
                        <img src="https://minotar.net/avatar/MHF_Steve/100.png" id="skin" className="skin" />
                    </div>
                    <div className="news">
                        <h3>News</h3>
                        <div className="newsContent">
                            <div className="newsContentHeader">
                            </div>
                            <div className="newsContentBody">
                                <div className="newsContentBodyText">{news ? news.map((article: any) => {
                                    return (
                                        <div className="newsContentBodyArticle" key={article.title}>
                                            <h4>{article.title}</h4>
                                            <article>
                                                {window.html.parse(article.content)}
                                            </article>
                                        </div>
                                    )
                                }) : "Pas de nouveauté pour le moment"}</div>
                            </div>
                        </div>
                    </div>
                </div>
                <footer id="footer">
                    <button id="options" className="launchButton" onClick={this.displayModal}>OPTIONS</button>
                    <div id="progressBar" className="progressBar">
                        <h3 id="status" className="status">{updateText}</h3>
                        <div className="progress" style={{width: `${progress}%`}}></div>
                    </div>
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
                    <button id="playbtn" className="launchButton" onClick={this.handlePlay}>JOUER</button>
                </footer>
                <script src="../public/scripts/main.js"></script>
            </>
        )
    }
}

export default withRouter<Props>(Launcher);