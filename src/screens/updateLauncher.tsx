import { Component } from "react";
import { withRouter } from "utils/withRouter";
import { NavigateFunction } from "react-router-dom";
import Swal from "sweetalert2";

import Footer from "screens/footer";

import 'css/style.css'

type Props = {
    navigate?: NavigateFunction;
}

type State = {
    progress: number;
    updateText: string;
  };

class UpdateLauncher extends Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            progress: 0,
            updateText: ""
        }
    }
    componentDidMount() {
        window.ipc.send("check-update");

        window.ipc.receive('update-failed', (error) => {
            Swal.fire({
                title: "Une erreur est survenue",
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

        window.ipc.receive('update-progress', (progress) => {
            this.setState({updateText: `Mise à jour en cours : ${progress}%`})
            this.setState({progress: progress})
        })

        window.ipc.receive('update-finished', (askInstall) => {
            if (askInstall) {
                Swal.fire({
                    title: "Mise à jour disponible",
                    text: "Une mise à jour est disponible, voulez-vous l'installer ?",
                    icon: "question",
                    iconColor: "#54c2f0",
                    confirmButtonText: "Installer",
                    cancelButtonText: "Annuler",
                    showCancelButton: true,
                    background: "#1e1e1e",
                    confirmButtonColor: "#54c2f0",
                    cancelButtonColor: "#ff0000"
                }).then((result) => {
                    if (result.isConfirmed) {
                        window.ipc.send("install-update");
                    }
                    else {
                        this.props.navigate!(`/auth`);
                    }
                })
            }
            else {
                this.props.navigate!(`/auth`);
            }
        })

    }

    render() {
        const {progress, updateText} = this.state;
        return (
            <div className='updateBox'>
                <div className='updateText'>{updateText || "Vérification des mises à jour ..."}</div>
                <div className='updateBar'>
                    <div className='updateBarProgress' style={{width: `${progress}%`}}></div>
                </div>
            </div>
        )
    }
}

export default withRouter<Props>(UpdateLauncher);