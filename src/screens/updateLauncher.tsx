import { Component } from "react";
import { withRouter } from "utils/withRouter";
import { NavigateFunction } from "react-router-dom";
import Swal from "sweetalert2";
import { WithTranslation, withTranslation } from "react-i18next";
import "i18n"

import Footer from "screens/footer";

import 'scss/updateLauncher.scss'

type Props = {
    navigate?: NavigateFunction;
}

type State = {
    progress: number;
    updateText: string;
  };

class UpdateLauncher extends Component<Props & WithTranslation, State> {
    // constructor(props: Props) {
    //     super(props);

    //     this.state = {
    //         progress: 0,
    //         updateText: ""
    //     }
    // }

    state = {
        progress: 0,
        updateText: ""
    }

    componentDidMount() {
        const {t} = this.props
        window.ipc.send("check-update");

        window.ipc.receive('update-failed', (error) => {
            Swal.fire({
                title: t("update.update-failed-title"),
                text: error,
                icon: "error",
                iconColor: "#ff0000",
                confirmButtonText: "Fermer",
                background: "#1e1e1e",
                confirmButtonColor: "#ff0000"
            }).then(() => {
                this.props.navigate!(`/auth`);
            })
        
        })

        let updateData: any

        window.ipc.receive('update-available', (versionData) => {
            updateData = versionData;
            Swal.fire({
                title: t("update.update-found-title"),
                text: t("update.update-found-text", {version: `${updateData.version}`}),
                icon: "question",
                iconColor: "#54c2f0",
                confirmButtonText: t("update.update-found-confirmButton"),
                cancelButtonText: t("update.update-found-cancelButton"),
                showCancelButton: true,
                background: "#1e1e1e",
                confirmButtonColor: "#54c2f0",
                cancelButtonColor: "#ff0000"
            }).then((result) => {
                if (result.isConfirmed) {
                    window.ipc.send("install-update", `https://github.com/Dragonir44/JFLauncher/releases/download/${updateData.tag}/JFLauncher-setup-${updateData.version}.exe`);
                }
                else {
                    this.props.navigate!(`/auth`);
                }
            })
        })
        window.ipc.receive('no-update', () => {
            this.props.navigate!(`/auth`);
        })

    }

    render() {
        const {progress, updateText} = this.state;
        const {t} = this.props
        return (
            <>
                <div className='updateBox'>
                    <div className='updateText'>{updateText || t("update.searching")}</div>
                    {/* <div className='updateBar'>
                        <div className='updateBarProgress' style={{width: `${progress}%`}}></div>
                    </div> */}
                </div>
                <Footer/>
            </>
        )
    }
}

export default withTranslation()(withRouter<Props & WithTranslation>(UpdateLauncher));