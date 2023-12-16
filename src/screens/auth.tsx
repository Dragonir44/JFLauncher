import { Component } from "react";
import { withRouter } from "utils/withRouter";
import { NavigateFunction } from "react-router-dom";
import Footer from "screens/footer";

import 'scss/auth.scss'

type Props = {
    navigate?: NavigateFunction;
}

type State = {
    accounts: any;
}

class Auth extends Component<Props, State> {

    constructor(props: Props) {
        super(props);

        this.state = {
            accounts: [],
        }
    }

    async componentDidMount() {
        try {
            const registeredAccounts = JSON.parse(await window.store.get("registeredAccounts") || "[]") 
            if (registeredAccounts && this.state.accounts.length === 0) {
                this.setState({ accounts: registeredAccounts });
            }
            window.ipc.receive("auth-success", async () => {
                const registeredAccounts = JSON.parse(await window.store.get("registeredAccounts") || "[]")
                if (registeredAccounts && this.state.accounts.length === 0) {
                    this.setState({ accounts: registeredAccounts });
                }
            })
            window.ipc.receive("auth-failed", (err) => {
                console.log(err)
            })
            window.ipc.receive("connect", ()=> {
                this.props.navigate!("/launcher");
            })
        }
        catch(err) {
            console.error(err)
            throw err
        }
    }


    handleConnect = (e: any) => {
        e.currentTarget.disabled = true;
        window.ipc.send("login", {})
    }

    render() {
        const { accounts } = this.state
        return (
            <>
                <div className="login-page">

                    <div className="accountList">
                        {accounts && accounts.map((data: any) => {
                            console.log(data)
                            if (data.token.profile.name) {
                                return (
                                    <div className="account" key={data.token.mcToken}>
                                        <img src={`https://mc-heads.net/avatar/${data.token.profile.name}`} className="skin" />
                                        <div className="accountName">{data.token.profile.name}</div>

                                        <div className="accountButtons">
                                            <button className="accountButton play" onClick={(e) => {
                                                e.currentTarget.disabled = true;
                                                window.ipc.send("loginToken", JSON.stringify(data))
                                            }}>
                                            <img src="assets/play.svg" className="accountButtonIcon" />
                                            </button>
                                            <button className="accountButton delete" onClick={async () => {
                                                const accounts = JSON.parse(await window.store.get("registeredAccounts") as string || "{}");
                                                const updatedAccounts = accounts.filter((account: any) => account.id !== data.id);
                                                await window.store.set("registeredAccounts", JSON.stringify(updatedAccounts));
                                                this.setState({ accounts: updatedAccounts });
                                            }}>
                                                <img src="assets/delete.svg" className="accountButtonIcon" />
                                            </button>
                                        </div>
                                    </div>
                                )
                            }
                        })}
                        {
                            accounts.length < 2 && 
                            <button className="addAccount" onClick={this.handleConnect}>
                                <img src="assets/addAccount.svg" className="addAccountIcon" />
                                <div className="addAccountText">Ajouter un compte</div>
                            </button>
                        }
                    </div>
                </div>
                <Footer />
            </>
        )
    }
}

export default withRouter<Props>(Auth);