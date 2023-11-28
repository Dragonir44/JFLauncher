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
            const userDetails = await window.store.get("userDetails")
            const accounts = JSON.parse(await window.store.get("token"))
            if (accounts && this.state.accounts.length === 0) {
                this.setState({ accounts: [{userDetails: userDetails, account: accounts}] });
            }
            window.ipc.receive("auth-success", () => {
                this.props.navigate!(`/launcher`);
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
        let countAccounts = 0
        return (
            <>
                <div className="login-page">

                    <div className="accountList">
                        {accounts.map((data: any) => {
                            if (data.account.profile.name) {
                                data.id = countAccounts++
                                return (
                                    <div className="account" key={data.account.profile.id}>
                                        <img src={`https://mc-heads.net/avatar/${data.account.profile.name}`} className="skin" />
                                        <div className="accountName">{data.account.profile.name}</div>

                                        <div className="accountButtons">
                                            <button className="accountButton play" onClick={(e) => {
                                                e.currentTarget.disabled = true;
                                                window.ipc.send("loginToken", JSON.parse(data.userDetails))
                                            }}>
                                            <img src="assets/play.svg" className="accountButtonIcon" />
                                            </button>
                                            {/* <button className="accountButton delete" onClick={async () => {
                                                const accounts = JSON.parse(await window.store.get("token") || "{}")
                                                console.log(accounts[data.id])
                                                // delete accounts[data.id-1]
                                                // window.store.set("token", JSON.stringify(accounts))
                                                // this.setState({ accounts: Object.values(accounts) });
                                            }}>
                                                <img src="assets/delete.svg" className="accountButtonIcon" />
                                            </button> */}
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