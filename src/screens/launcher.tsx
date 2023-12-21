import { Component } from "react";
import { withRouter } from "utils/withRouter";
import { NavigateFunction } from "react-router-dom";
import Select, { StylesConfig } from "react-select";
import Swal from "sweetalert2";
import { WithTranslation, withTranslation } from "react-i18next";
import "i18n"
import OptionsModal from "./optionsModal";

import 'scss/launcher.scss';

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
    serverStatus?: any;
}

const customStyles: StylesConfig = {
    dropdownIndicator: (provided:any, state:any) => ({
        ...provided,
        transform: state.selectProps.menuIsOpen && 'rotate(180deg)',
        color: state.selectProps.menuIsOpen && '#fff'
    })
}

class Launcher extends Component<Props & WithTranslation, InputChange> {

    state = {
        currentRam: 1,
        progress: 0,
        updateText: "",
        options: [],
        selectedChannel: {value: "beta", label: "Beta"},
        news: [],
        serverStatus: {
            online: false,
            version: "",
            onlinePlayers: '0',
            maxPlayers: '20'
        }
    }
    
    async componentDidMount() {
        const selectedAccount = JSON.parse(await window.store.get("selectedAccount"))
        const pseudo = document.getElementById("pseudo") as HTMLSpanElement
        const skin = document.getElementById("skin") as HTMLImageElement
        const savedRam = await window.store.get("ram")
        const channels = await window.ipc.sendSync("getChannels")
        const defaultChannel = await window.store.get("channel")
        const refreshTime = await window.store.get("refreshTime")
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
        
        const configs = await window.store.get("config");
        this.setState({ news: configs.news });

        setInterval(async () => {
            const configs = await window.store.get("config");
            this.setState({ news: configs.news });
        }, refreshTime);

        pseudo.innerHTML = selectedAccount.token.profile.name
        skin.src = `https://mc-heads.net/avatar/${selectedAccount.token.profile.name}`
        

        this.setState({options: options})
        this.setState({currentRam: Number(savedRam || "1")})
        this.setState({updateText: "Recherche de maj..."})

        window.ipc.receive('updateText', (data) => {this.setState({updateText:`${data} : ${this.state.progress}%`})})

        window.ipc.receive('updateProgress', (data) => {this.setState({progress: data})})

        window.ipc.receive('closed', () => {
            const progressBar = document.getElementById("progressBar") as HTMLDivElement
            const playbtn = document.getElementById("playbtn") as HTMLButtonElement
            const selectChannel = document.getElementById("channel") as HTMLSelectElement
            selectChannel.disabled = false;
            selectChannel.style.display = 'block';
            progressBar.style.display = 'none'
            playbtn.disabled = false;
            this.setState({updateText: "", progress: 0})
        })

        window.ipc.receive('message', function(text) {
            const container = document.getElementById('messages') as HTMLDivElement;
            const message = document.createElement('div');
            message.innerHTML = text;
            container.appendChild(message);
        })

        setInterval(() => window.ipc.send("server-ping"), 1000)
        window.ipc.receive('server-ping-response', (data) => {this.setState({serverStatus: data})})

        window.ipc.receive('reinstall-complete', () => {
            const progressBar = document.getElementById("progressBar") as HTMLDivElement
            const playbtn = document.getElementById("playbtn") as HTMLButtonElement
            const selectChannel = document.getElementById("channel") as HTMLSelectElement
            const reinstall = document.getElementById("reinstall") as HTMLButtonElement
            selectChannel.disabled = false;
            selectChannel.style.display = 'block';
            progressBar.style.display = 'none'
            playbtn.disabled = false;
            reinstall.disabled = false;
            this.setState({updateText: "", progress: 0})
        })

        window.ipc.receive('reinstall-error', (err) => {
            const progressBar = document.getElementById("progressBar") as HTMLDivElement
            const playbtn = document.getElementById("playbtn") as HTMLButtonElement
            const selectChannel = document.getElementById("channel") as HTMLSelectElement
            const reinstall = document.getElementById("reinstall") as HTMLButtonElement
            selectChannel.disabled = false;
            selectChannel.style.display = 'block';
            progressBar.style.display = 'none'
            playbtn.disabled = false;
            reinstall.disabled = false;
            this.setState({updateText: "", progress: 0})
            Swal.fire({
                title: "Une erreur est survenue",
                showDenyButton: true,
                text: err,
                icon: "error",
                iconColor: "#ff0000",
                confirmButtonText: "Fermer",
                denyButtonText: "Réessayer",
                background: "#1e1e1e",
                confirmButtonColor: "#ff0000"
            }).then((result) => {
                if (result.isConfirmed) {
                    return
                }
                if (result.isDenied) {
                    selectChannel.disabled = true;
                    selectChannel.style.display = 'none';
                    progressBar.style.display = 'block'
                    playbtn.disabled = true;
                    window.ipc.send("reinstall", {channel: this.state.selectedChannel.value});
                }
            })
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
        window.ipc.send("updateChannel")
    }
    
    displayModal = (e: any) => {
        const modal = document.getElementById("myModal");
        modal!.style.display = "block";
    }

    render() {
        const { progress, updateText, options, currentRam, selectedChannel, news, serverStatus } = this.state
        const {t} = this.props
        return (
            <>
                <header>
                    <div id="messages"></div>
                </header>
                <OptionsModal />
                <div id="top" className="top">
                    <div className="userInfo">
                        <div id="skinFrame" className="skinFrame">
                            <img src="https://mc-heads.net/avatar/MHF_Steve" id="skin" className="skin" />
                        </div>
                        <b id="pseudo"></b>
                    </div>
                    <div className="serverStatus">
                        <h3>{t('launcher.server-title')}</h3>
                        <div className="serverStatusContent">
                            
                            <article className="state"><strong>{t('launcher.server-status-title')}</strong>: {serverStatus.online ? t('launcher.server-status-online') : t('launcher.server-status-offline')} <div className={`serverStatusContentStatusIcon ${serverStatus.online ? 'online' : 'offline'}`}></div></article>

                            <div className="serverStatusContentPlayers">
                                <div className="serverStatusContentPlayersIcon"></div>
                                <div className="serverStatusContentPlayersText">
                                    <p><strong>{t('launcher.server-status-players')}</strong> : {serverStatus.onlinePlayers}/{serverStatus.maxPlayers}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="socialBox">
                        <div id="github" className="social github">
                            <span className="label">Github</span>
                            <img id="githubLink" src='assets/github.png' onClick={() => window.ipc.send('open-external-link', "https://github.com/Dragonir44/JFLauncher")}/>
                        </div>
                        <div id="curseforge" className="social curseforge">
                            <span className="label">Curseforge</span>
                            <img id="curseforgeLink" src='assets/curseforge.png' onClick={() => window.ipc.send('open-external-link', "https://www.curseforge.com/minecraft/modpacks/jimmus-factory")}/>
                        </div>
                    </div>
                </div>
                <div id="middle" className="middle">
                    <div id="newsModal" className="newsModal">
                        <span className="newsModalClose" onClick={() => {
                            const newsModel = document.getElementById("newsModal") as HTMLDivElement
                            newsModel.style.display = "none"
                        }}>&times;</span>
                        <div className="newsModalContent">
                            <div id="newsContentBodyArticleContent" className="newsContentBodyArticleContent"></div>
                        </div>
                    </div>
                    <div className="news">
                        <h3>{t('launcher.news')}</h3>
                        <div className="newsContent">
                            {news.length > 0 ? news.map((article: any) => {
                                return (
                                    <div className="newsContentBodyArticle" key={article.title} onClick={
                                        () => {
                                            const newsContentBodyArticleContent = document.getElementById("newsContentBodyArticleContent") as HTMLDivElement
                                            newsContentBodyArticleContent.innerHTML = `
                                                <h4 class="title">${article.title}</h4>
                                                <article class="articleContent">
                                                    ${article.content}
                                                </article>
                                            `
                                            const newsModel = document.getElementById("newsModal") as HTMLDivElement
                                            newsModel.style.display = "flex"
                                        }
                                    }>
                                        <h4 className="title">{article.title}</h4>
                                    </div>
                                )
                            }) : t("launcher.no-news")}
                        </div>
                    </div>
                </div>
                <footer id="footer">
                    <button id="options" className="launchButton" onClick={this.displayModal}>{t('launcher.settings').toUpperCase()}</button>
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
                    <button id="playbtn" className="launchButton" onClick={this.handlePlay}>{t('launcher.play').toUpperCase()}</button>
                </footer>
                <script src="../public/scripts/main.js"></script>
            </>
        )
    }
}

export default withTranslation()(withRouter<Props & WithTranslation>(Launcher));