import { Component } from "react";
import { WithTranslation, withTranslation } from "react-i18next"
import "i18n"

class Footer extends Component<WithTranslation> {
    render() {
        const {t} = this.props
        return (
            <div className="disclaimer">
                <p>
                    <b>{t("footer.warning")}</b> {t("footer.warning-text")}
                </p>
                <p>
                    <b>{t("footer.disclaimer")}</b> {t("footer.disclaimer-text")}
                </p>
            </div>
        )
    }
}

export default withTranslation()(Footer)