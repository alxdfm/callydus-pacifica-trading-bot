import { useI18n } from "../../shared/i18n/I18nProvider";
import { useAppState } from "../../state/app-state";
import { PlaceholderPage } from "./PlaceholderPage";

function valueOrEmpty(value: string | null, fallback: string) {
  return value ?? fallback;
}

export function OnboardingPage() {
  const { canAccessProduct, state } = useAppState();
  const { t } = useI18n();

  return (
    <div className="page-stack">
      <PlaceholderPage
        titleKey="pageOnboardingTitle"
        descriptionKey="pageOnboardingDescription"
        actionKey="pageOnboardingAction"
      />

      <section className="page-card state-card">
        <header className="page-card__header">
          <div>
            <p className="page-card__eyebrow">{t("pageStatusLabel")}</p>
            <h3>{t("statePanelTitle")}</h3>
          </div>
          <span className="page-card__badge">
            {canAccessProduct ? t("stateAccessGranted") : t("stateAccessBlocked")}
          </span>
        </header>

        <dl className="state-grid">
          <div>
            <dt>{t("stateWalletStatus")}</dt>
            <dd>{state.wallet.sessionStatus}</dd>
          </div>
          <div>
            <dt>{t("stateCredentialStatus")}</dt>
            <dd>{state.credentials.validationStatus}</dd>
          </div>
          <div>
            <dt>{t("stateOnboardingStatus")}</dt>
            <dd>{state.onboarding.status}</dd>
          </div>
          <div>
            <dt>{t("stateAccessStatus")}</dt>
            <dd>{canAccessProduct ? t("stateAccessGranted") : t("stateAccessBlocked")}</dd>
          </div>
          <div>
            <dt>{t("stateMainWalletLabel")}</dt>
            <dd>{valueOrEmpty(state.wallet.mainWalletPublicKey, t("stateEmptyValue"))}</dd>
          </div>
          <div>
            <dt>{t("stateAgentWalletLabel")}</dt>
            <dd>{valueOrEmpty(state.credentials.agentWalletPublicKey, t("stateEmptyValue"))}</dd>
          </div>
          <div>
            <dt>{t("stateLocaleLabel")}</dt>
            <dd>{state.locale}</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
