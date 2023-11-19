import { Component } from "react";
import { withRouter } from "utils/withRouter";
import { NavigateFunction } from "react-router-dom";
import Footer from "screens/footer";

import 'css/style.css'

type Props = {
    navigate?: NavigateFunction;
}

class Auth extends Component<Props> {

    async componentDidMount() {
        const userDetails = await window.store.get("userDetails")
        if (userDetails) {
            const playbtn = document.getElementById("play") as HTMLButtonElement
            playbtn.disabled = true;
            window.ipc.send("loginToken", JSON.parse(userDetails))
        }
        window.ipc.receive("auth-success", () => {
            this.props.navigate!(`/launcher`);
        })
    }


    handleConnect = (e: any) => {
        e.currentTarget.disabled = true;
        window.ipc.send("login", {})
    }

    render() {
        return (
            <>
                <div className="login-page">
                    <div className="form">
                        <button id="play" onClick={this.handleConnect}>Connexion</button>
                    </div>
                </div>
                <Footer />
            </>
        )
    }
}

export default withRouter<Props>(Auth);