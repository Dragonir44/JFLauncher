import { Component } from "react";
import { withRouter } from "utils/withRouter";
import { NavigateFunction } from "react-router-dom";
import Swal from "sweetalert2";
import withReactContent from 'sweetalert2-react-content'
import { WithTranslation, withTranslation } from "react-i18next";
import "i18n"
import OptionsModal from "./optionsModal";

import 'scss/launcher.scss';

const MySwal = withReactContent(Swal)
let navLang: string = navigator.language.split("-")[0]
navLang = (navLang).charAt(0).toUpperCase() + (navLang).slice(1)

type Props = {
    navigate?: NavigateFunction;
}

interface InputChange {
    progress?: number;
    updateText?: string;
    channels?: string[];
    selectedChannel?: any;
    selectedVersion?: any;
    news?: any;
    serverStatus?: any;
    modalVisible?: boolean;
    newsContent?: any;
}

class Launcher extends Component<Props & WithTranslation, InputChange> {

    state = {
        progress: 0,
        updateText: "",
        options: [],
        selectedChannel: {value: "release", label: "Release"},
        selectedVersion: {value: "latest", label: "Latest"},
        news: [],
        serverStatus: {
            online: false,
            version: "",
            onlinePlayers: '0',
            maxPlayers: '20',
            motd : ""
        },
        modalVisible: false,
        newsContent: [
            {
                date: "",
                lang: {
                    fr: {
                        title: "",
                        content: ""
                    },
                    en: {
                        title: "",
                        content: ""
                    }
                }
            }
        ]
    }
    
    async componentDidMount() {
        const selectedAccount = JSON.parse(await window.store.get("selectedAccount"))
        const pseudo = document.getElementById("pseudo") as HTMLSpanElement
        const skin = document.getElementById("skin") as HTMLImageElement
        const refreshTime = await window.store.get("refreshTime")
        const selectChannel = document.getElementById("channel") as HTMLSelectElement
        const rawNews: any = await window.ipc.sendSync("getNews")
        const {t} = this.props

        selectChannel.disabled = false;
        selectChannel.style.display = 'block';
        
        const configs = await window.store.get("config");
        this.setState({ news: configs.news });

        setInterval(async () => {
            const configs = await window.store.get("config");
            this.setState({ news: configs.news });
        }, refreshTime);

        pseudo.innerHTML = selectedAccount.token.profile.name
        skin.src = `https://mc-heads.net/avatar/${selectedAccount.token.profile.name}`

        const newsContent = rawNews.reverse().map((article: any) => {
            if (article.lang[navLang] !== undefined) {
                return {id: article._id ,date: article.date, lang: article.lang[navLang]}
            }
            if (article.lang[navLang.toLowerCase()] !== undefined) {
                return {id: article._id, date: article.date, lang: article.lang[navLang.toLowerCase()]}
            }
            return false
        })
        
        this.setState({newsContent: newsContent})

        this.setState({updateText: "Recherche de maj..."})

        window.ipc.receive('updateText', (data) => {this.setState({updateText: t(data, {progress: this.state.progress})})})

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

        setInterval(() => {
            window.ipc.send("server-ping")
        }, refreshTime)
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
            MySwal.fire({
                title: "Une erreur est survenue",
                showDenyButton: true,
                text: err,
                icon: "error",
                iconColor: "#ff0000",
                confirmButtonText: "Fermer",
                denyButtonText: "Réessayer",
                background: "#1e1e1e",
                confirmButtonColor: "#ff0000",
                color: "#fff"
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

    handlePlay = async (e: any) => {
        const ram = document.getElementById("ram") as HTMLInputElement
        const progressBar = document.getElementById("progressBar") as HTMLDivElement
        const selectChannel = document.getElementById("channel") as HTMLSelectElement
        const width = document.getElementById("window-width") as HTMLInputElement
        const height = document.getElementById("window-height") as HTMLInputElement
        const fullscreen = document.getElementById("fullscreen") as HTMLInputElement
        const autoConnect = document.getElementById("autoConnect") as HTMLInputElement
        const serverAddress = document.getElementById("server-address") as HTMLInputElement
        const serverPort = document.getElementById("server-port") as HTMLInputElement
        const playbtn = document.getElementById("playbtn") as HTMLButtonElement
        const channel = await window.store.get('channel')
        
        if (channel.version.value === "latest")
            channel.version = await window.ipc.sendSync("retrieveVersion", {channel: channel.channel.value, version: "latest"})
        selectChannel.disabled = true;
        progressBar.style.display = 'block'
        playbtn.disabled = true;
        let opts: any = {
            ram: ram.value,
            selectedChannel: channel,
            width: width.value || 854,
            height: height.value || 480,
            fullscreen: fullscreen.checked,
            autoConnect: autoConnect.checked
        }

        opts.serverAddress = autoConnect.checked ? serverAddress.value : undefined,
        opts.serverPort = autoConnect.checked ? serverPort.value : undefined

        window.ipc.send("launch", opts);
    }
    

    render() {
        const { progress, updateText, news, serverStatus, newsContent } = this.state
        const {t} = this.props
        return (
            <>
                <header>
                    <div id="messages"></div>
                </header>
                <div className="content">
                    <OptionsModal />
                    <div id="top" className="top">
                        <div className="socialBox">
                            <div id="github" className="social github">
                                <img id="githubLink" src='assets/github.png' onClick={() => window.ipc.send('open-external-link', "https://github.com/Dragonir44/JFLauncher")}/>
                                <span className="label">Github</span>
                            </div>
                            <div id="curseforge" className="social curseforge">
                                <img id="curseforgeLink" src='assets/curseforge.png' onClick={() => window.ipc.send('open-external-link', "https://www.curseforge.com/minecraft/modpacks/jimmus-factory")}/>
                                <span className="label">Curseforge</span>
                            </div>
                        </div>
                    </div>
                    
                    <div id="middle" className="middle">
                        <div className="middle__card userInfo">
                            <img src="https://mc-heads.net/avatar/MHF_Steve" id="skin" className="skin" />
                            <b id="pseudo" className="pseudo"></b>
                            <button id="playbtn" className="middle__card--playButton" onClick={this.handlePlay}>{t('launcher.play').toUpperCase()}</button>
                        </div>
                        <div className="middle__card news">
                            <h3>{t('launcher.news')}</h3>
                            <div className="newsContent">
                                {newsContent.length > 0 ? newsContent.map((article: any) => {
                                    if (article.lang.title != "" || article.lang.title != undefined)
                                        return (
                                            <div className="newsContentBodyArticle" key={article.id} onClick={
                                                () => {
                                                    MySwal.fire({
                                                        title: article.lang.title,
                                                        html: article.lang.content,
                                                        icon: "info",
                                                        iconColor: "#54c2f0",
                                                        confirmButtonText: "Fermer",
                                                        background: "#1e1e1e",
                                                        confirmButtonColor: "#54c2f0",
                                                        color: "#fff"
                                                    })
                                                }
                                            }>
                                                <h4 className="title">{article.lang.title}</h4>
                                            </div>
                                        )
                                }) : t("launcher.no-news")}
                            </div>
                        </div>
                        <div className="middle__card serverStatus">
                            <h3>{t('launcher.server-title')}</h3>
                            <div className="serverStatusContent">
                                <article className="state">
                                    <strong>{t('launcher.server-status-title')}</strong>
                                    <div className="status">
                                        {
                                            serverStatus.online 
                                            ? t('launcher.server-status-online') 
                                            : t('launcher.server-status-offline')
                                        } 
                                        <div className={`serverStatusContentStatusIcon ${serverStatus.online ? 'online' : 'offline'}`}></div>
                                    </div>
                                </article>
                                {
                                    serverStatus.online
                                    ? <div className="serverStatusContentPlayers">
                                        <div className="serverStatusContentPlayersText">
                                            <strong>{t('launcher.server-status-players')}</strong>
                                            <div className="player">
                                                {serverStatus.onlinePlayers}/{serverStatus.maxPlayers}
                                            </div>
                                        </div>
                                    </div>
                                    : ""
                                }
                            </div>
                        </div>
                    </div>
                </div>
                <footer id="footer">
                    <div id="progressBar" className="progressBar">
                        <h3 id="status" className="status">{updateText}</h3>
                        <div className="progress" style={{width: `${progress}%`}}></div>
                    </div>
                </footer>
                <script src="../public/scripts/main.js"></script>
            </>
        )
    }
}

export default withTranslation()(withRouter<Props & WithTranslation>(Launcher));