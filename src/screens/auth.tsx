import { Component } from "react";
import { withRouter } from "utils/withRouter";
import { NavigateFunction } from "react-router-dom";
import Footer from "screens/footer";
import { WithTranslation, withTranslation } from "react-i18next";
import "i18n"

import 'scss/auth.scss'

type Props = {
    navigate?: NavigateFunction;
}

type State = {
    accounts: any;
    error: string | null;
}

class Auth extends Component<Props & WithTranslation, State> {

    state = {
        accounts: [],
        error: null
    }

    async componentDidMount() {
        const { t } = this.props
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
                const addButton = document.getElementById("addAccount") as HTMLButtonElement;
                addButton!.disabled = false;
                this.setState({ error: err == "error.auth.xsts.userNotFound" ? t("auth.error-not-found") : err })
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
        const { t } = this.props
        return (
            <>
                <div className="login-page">
                    {
                        this.state.error && 
                        <div className="error">{t('auth.error', {error: this.state.error})}</div>
                    }
                    <div className="accountList">
                        {accounts && accounts.map((data: any) => {
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
                            <button id="addAccount" className="addAccount" onClick={this.handleConnect}>
                                <img src="assets/addAccount.svg" className="addAccountIcon" />
                                <div className="addAccountText">{t('auth.add-account')}</div>
                            </button>
                        }
                    </div>
                </div>
                <Footer />
            </>
        )
    }
}

export default withTranslation()(withRouter<Props & WithTranslation>(Auth));