import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type {
  PacificaValidationErrorCode,
  CredentialValidationStatus,
  OnboardingStatus,
  PacificaCredentialSubmission,
  PacificaCredentialValidationResponse,
  WalletSession,
} from "@pacifica/contracts";
import { validateAgentWalletLocally } from "../../features/onboarding/agent-wallet-validation";
import { useSolanaWalletPort } from "../../features/wallet/solana/SolanaWalletEnvironment";
import { useI18n } from "../../shared/i18n/I18nProvider";
import type { MessageKey } from "../../shared/i18n/messages";
import { useAppState } from "../../state/app-state";

type ProgressStep = {
  title: string;
  description: string;
  status: "pending" | "current" | "complete";
};

type FormFieldErrors = {
  agentWalletPublicKey?: string | undefined;
  agentWalletPrivateKey?: string | undefined;
};

type BadgeTone = "neutral" | "info" | "success" | "warning" | "danger";

function valueOrFallback(value: string | null | undefined, fallback: string) {
  return value ?? fallback;
}

function shortenPublicKey(value: string | null) {
  if (!value) {
    return null;
  }

  if (value.length <= 10) {
    return value;
  }

  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}

function mapCredentialFormState(status: CredentialValidationStatus, isFilled: boolean): MessageKey {
  switch (status) {
    case "validating":
      return "onboardingCredentialFormStateValidating";
    case "valid":
      return "onboardingCredentialFormStateValid";
    case "invalid":
    case "error":
      return "onboardingCredentialFormStateInvalid";
    default:
      return isFilled
        ? "onboardingCredentialFormStateFilled"
        : "onboardingCredentialFormStateEmpty";
  }
}

function mapWalletStatusToMessageKey(
  status: WalletSession["sessionStatus"],
): MessageKey {
  switch (status) {
    case "connected":
      return "onboardingStateWalletConnected";
    case "reconnecting":
      return "onboardingStateWalletReconnecting";
    case "error":
      return "onboardingStateWalletError";
    default:
      return "onboardingStateWalletDisconnected";
  }
}

function mapCredentialStatusToMessageKey(
  status: CredentialValidationStatus,
): MessageKey {
  switch (status) {
    case "validating":
      return "onboardingStateCredentialValidating";
    case "valid":
      return "onboardingStateCredentialValid";
    case "invalid":
      return "onboardingStateCredentialInvalid";
    case "error":
      return "onboardingStateCredentialError";
    default:
      return "onboardingStateCredentialPending";
  }
}

function mapOnboardingStatusToMessageKey(status: OnboardingStatus): MessageKey {
  switch (status) {
    case "credentials_pending":
      return "onboardingStatusCredentialsPending";
    case "credentials_validating":
      return "onboardingStatusCredentialsValidating";
    case "ready":
      return "onboardingStatusReady";
    case "blocked":
      return "onboardingStatusBlocked";
    default:
      return "onboardingStatusWalletPending";
  }
}

function mapWalletBadgeTone(status: WalletSession["sessionStatus"]): BadgeTone {
  switch (status) {
    case "connected":
      return "success";
    case "reconnecting":
      return "info";
    case "error":
      return "danger";
    default:
      return "neutral";
  }
}

function mapCredentialBadgeTone(status: CredentialValidationStatus): BadgeTone {
  switch (status) {
    case "valid":
      return "success";
    case "validating":
      return "warning";
    case "invalid":
    case "error":
      return "danger";
    default:
      return "neutral";
  }
}

function mapWalletMicrocopy(status: WalletSession["sessionStatus"]): MessageKey {
  switch (status) {
    case "connected":
      return "onboardingWalletMicrocopyConnected";
    case "reconnecting":
      return "onboardingWalletMicrocopyConnecting";
    case "error":
      return "onboardingWalletMicrocopyError";
    default:
      return "onboardingWalletMicrocopyPending";
  }
}

function mapWalletErrorCodeToMessageKey(
  errorCode: WalletSession["errorCode"],
): MessageKey | null {
  switch (errorCode) {
    case "wallet_provider_missing":
      return "onboardingWalletErrorProviderMissing";
    case "wallet_connection_rejected":
      return "onboardingWalletErrorRejected";
    case "wallet_connection_failed":
      return "onboardingWalletErrorFailed";
    case "wallet_session_lost":
      return "onboardingWalletErrorSessionLost";
    case "wallet_unsupported":
      return "onboardingWalletErrorUnsupported";
    default:
      return null;
  }
}

function mapCredentialMicrocopy(
  status: CredentialValidationStatus,
  isFilled: boolean,
  retryable: boolean,
): MessageKey {
  switch (status) {
    case "valid":
      return "onboardingCredentialMicrocopyValid";
    case "validating":
      return "onboardingCredentialMicrocopyValidating";
    case "invalid":
    case "error":
      return retryable
        ? "onboardingCredentialMicrocopyRetry"
        : "onboardingCredentialMicrocopyInvalid";
    default:
      return isFilled
        ? "onboardingCredentialMicrocopyFilled"
        : "onboardingCredentialMicrocopyEmpty";
  }
}

function mapAccountBadgeTone(canAccessProduct: boolean, status: OnboardingStatus): BadgeTone {
  if (canAccessProduct) {
    return "success";
  }

  if (status === "credentials_validating") {
    return "warning";
  }

  return "neutral";
}

function mapValidationCodeField(code: PacificaValidationErrorCode | null) {
  if (!code) {
    return null;
  }

  if (code === "invalid_agent_wallet_format" || code === "agent_wallet_mismatch") {
    return "agentWalletPublicKey";
  }

  if (code === "invalid_agent_wallet_secret") {
    return "agentWalletPrivateKey";
  }

  return null;
}

function buildProgressSteps(
  walletStatus: WalletSession["sessionStatus"],
  credentialStatus: CredentialValidationStatus,
  labels: Pick<
    ReturnType<typeof useI18n>,
    "t"
  >["t"],
): ProgressStep[] {
  const walletComplete = walletStatus === "connected";
  const credentialComplete = credentialStatus === "valid";

  return [
    {
      title: labels("onboardingStepWalletTitle"),
      description: labels("onboardingStepWalletDescription"),
      status: walletComplete ? "complete" : "current",
    },
    {
      title: labels("onboardingStepCredentialsTitle"),
      description: labels("onboardingStepCredentialsDescription"),
      status: credentialComplete ? "complete" : walletComplete ? "current" : "pending",
    },
  ];
}

export function OnboardingPage() {
  const navigate = useNavigate();
  const { canAccessProduct, setCredentialState, setOnboardingState, state } = useAppState();
  const { connectWallet, disconnectWallet } = useSolanaWalletPort();
  const { t } = useI18n();
  const [fieldErrors, setFieldErrors] = useState<FormFieldErrors>({});

  const walletStatusLabel = t(mapWalletStatusToMessageKey(state.wallet.sessionStatus));
  const credentialStatusLabel = t(
    mapCredentialStatusToMessageKey(state.credentials.validationStatus),
  );
  const onboardingStatusLabel = t(mapOnboardingStatusToMessageKey(state.onboarding.status));
  const walletBadgeTone = mapWalletBadgeTone(state.wallet.sessionStatus);
  const credentialBadgeTone = mapCredentialBadgeTone(state.credentials.validationStatus);
  const accountBadgeTone = mapAccountBadgeTone(canAccessProduct, state.onboarding.status);
  const progressSteps = buildProgressSteps(
    state.wallet.sessionStatus,
    state.credentials.validationStatus,
    t,
  );
  const walletConnected = state.wallet.sessionStatus === "connected";
  const isCredentialFormFilled = Boolean(
    state.credentials.agentWalletPublicKey?.trim() &&
      state.credentials.agentWalletPrivateKey?.trim(),
  );
  const credentialFormStateLabel = t(
    mapCredentialFormState(state.credentials.validationStatus, isCredentialFormFilled),
  );
  const walletMicrocopy = t(mapWalletMicrocopy(state.wallet.sessionStatus));
  const walletErrorMessageKey = mapWalletErrorCodeToMessageKey(state.wallet.errorCode);
  const walletErrorMessage = walletErrorMessageKey ? t(walletErrorMessageKey) : null;
  const credentialMicrocopy = t(
    mapCredentialMicrocopy(
      state.credentials.validationStatus,
      isCredentialFormFilled,
      state.credentials.retryable,
    ),
  );
  const validationMessage = state.credentials.lastValidationMessage
    ? state.credentials.lastValidationMessage
    : state.credentials.validationStatus === "valid"
      ? t("onboardingValueValidationSuccess")
      : t("onboardingValueAwaitingValidation");

  const credentialBanner = useMemo(() => {
    if (state.credentials.validationStatus === "valid") {
      return `${t("onboardingValidationSuccessPrefix")}: ${validationMessage}`;
    }

    if (
      state.credentials.validationStatus === "invalid" ||
      state.credentials.validationStatus === "error"
    ) {
      const prefix = state.credentials.retryable
        ? "onboardingValidationRetryablePrefix"
        : "onboardingValidationBlockedPrefix";
      return `${t(prefix)}: ${validationMessage}`;
    }

    return isCredentialFormFilled
      ? t("onboardingCredentialFormActionRequired")
      : t("onboardingFormHint");
  }, [
    isCredentialFormFilled,
    state.credentials.retryable,
    state.credentials.validationStatus,
    t,
    validationMessage,
  ]);

  function updateCredentialField(
    field: "agentWalletPublicKey" | "agentWalletPrivateKey" | "credentialAlias",
    value: string,
  ) {
    setCredentialState({
      [field]: value || null,
      validationStatus:
        state.credentials.validationStatus === "valid" ||
        state.credentials.validationStatus === "invalid" ||
        state.credentials.validationStatus === "error" ||
        state.credentials.validationStatus === "validating"
          ? "pending"
          : state.credentials.validationStatus,
      lastErrorCode: null,
      lastValidationMessage: null,
      retryable: false,
    });
  }

  function validateRequiredFields() {
    const nextErrors: FormFieldErrors = {};

    if (!state.credentials.agentWalletPublicKey?.trim()) {
      nextErrors.agentWalletPublicKey = "Agent Wallet public key is required.";
    }

    if (!state.credentials.agentWalletPrivateKey?.trim()) {
      nextErrors.agentWalletPrivateKey = "Agent Wallet private key is required.";
    }

    setFieldErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  }

  async function handleValidateCredentials() {
    if (!walletConnected || !state.wallet.mainWalletPublicKey) {
      setCredentialState({
        validationStatus: "error",
        lastErrorCode: "wallet_not_connected",
        lastValidationMessage: "Connect the main wallet before validating the Agent Wallet.",
        retryable: false,
      });
      setOnboardingState({
        status: "wallet_pending",
        accountReady: false,
      });
      return;
    }

    if (!validateRequiredFields()) {
      setCredentialState({
        validationStatus: "invalid",
        lastErrorCode: null,
        lastValidationMessage: "Complete the required Agent Wallet fields before validating.",
        retryable: false,
      });
      setOnboardingState({
        status: "credentials_pending",
        accountReady: false,
      });
      return;
    }

    setFieldErrors({});
    setCredentialState({
      validationStatus: "validating",
      lastErrorCode: null,
      lastValidationMessage: "Validating Agent Wallet against the Sprint 1 contract.",
      retryable: false,
    });
    setOnboardingState({
      status: "credentials_validating",
      accountReady: false,
    });

    const response = await validateAgentWalletLocally({
      mainWalletPublicKey: state.wallet.mainWalletPublicKey,
      agentWalletPublicKey: state.credentials.agentWalletPublicKey ?? "",
      agentWalletPrivateKey: state.credentials.agentWalletPrivateKey ?? "",
      credentialAlias: state.credentials.credentialAlias,
    } satisfies PacificaCredentialSubmission);

    applyValidationResponse(response);
  }

  function applyValidationResponse(response: PacificaCredentialValidationResponse) {
    if (response.canProceed) {
      setFieldErrors({});
      setCredentialState({
        credentialId: response.credentialId,
        keyFingerprint: response.keyFingerprint,
        validationStatus: "valid",
        lastValidatedAt: response.validatedAt,
        lastErrorCode: null,
        lastValidationMessage: "Agent Wallet validated successfully.",
        retryable: false,
      });
      setOnboardingState({
        status: "ready",
        accountReady: true,
      });
      return;
    }

    const invalidField = mapValidationCodeField(response.code);

    setFieldErrors({
      agentWalletPublicKey:
        invalidField === "agentWalletPublicKey" ? response.message : undefined,
      agentWalletPrivateKey:
        invalidField === "agentWalletPrivateKey" ? response.message : undefined,
    });
    setCredentialState({
      credentialId: null,
      keyFingerprint: null,
      validationStatus: response.status === "invalid" ? "invalid" : "error",
      lastValidatedAt: null,
      lastErrorCode: response.code,
      lastValidationMessage: response.message,
      retryable: response.retryable,
    });
    setOnboardingState({
      status: "blocked",
      accountReady: false,
    });
  }

  function clearCredentialForm() {
    setFieldErrors({});
    setCredentialState({
      agentWalletPublicKey: null,
      agentWalletPrivateKey: null,
      credentialAlias: null,
      credentialId: null,
      keyFingerprint: null,
      validationStatus: "pending",
      lastValidatedAt: null,
      lastErrorCode: null,
      lastValidationMessage: null,
      retryable: false,
    });
    setOnboardingState({
      status: walletConnected ? "credentials_pending" : "wallet_pending",
      accountReady: false,
    });
  }

  return (
    <div className="onboarding-flow">
      <aside className="onboarding-side">
        <div className="onboarding-brand">
          <div className="onboarding-brand__mark">P</div>
          <div>
            <p className="page-card__eyebrow">{t("appName")}</p>
            <h1>{t("pageOnboardingTitle")}</h1>
          </div>
        </div>

        <div className="onboarding-side__copy">
          <h2>{t("onboardingHeroTitle")}</h2>
          <p>{t("onboardingHeroDescription")}</p>
        </div>

        <div className="onboarding-side__steps">
          {progressSteps.map((step, index) => (
            <article key={step.title} className={`step-item ${step.status}`}>
              <span className="step-index">{index + 1}</span>
              <div>
                <strong>{step.title}</strong>
                <p>{step.description}</p>
              </div>
            </article>
          ))}
        </div>

        <div className="nav-card">
          <span className={`badge badge--${accountBadgeTone}`}>
            {canAccessProduct ? t("onboardingStateAccessReady") : t("onboardingStateAccessBlocked")}
          </span>
          <strong>{t("onboardingPanelTitle")}</strong>
          <p>{t("onboardingPanelDescription")}</p>
        </div>
      </aside>

      <main className="onboarding-main">
        <header className="topbar">
          <div>
            <p className="page-card__eyebrow">{t("onboardingEyebrow")}</p>
            <h2>{t("onboardingPanelEyebrow")}</h2>
            <p className="subtle">{t("onboardingProgressLabel")}</p>
          </div>
          <div className="topbar-actions">
            <span className={`badge badge--${accountBadgeTone}`}>{onboardingStatusLabel}</span>
            <span className="nav-item">{t("onboardingStepCredentialsTitle")}</span>
          </div>
        </header>

        <section className="onboarding-grid">
          <section className="panel wallet-panel">
            <div className="row-between align-start section-gap">
              <div>
                <p className="panel-label">{t("onboardingCardWalletEyebrow")}</p>
                <h3>{t("onboardingCardWalletTitle")}</h3>
                <p className="panel-copy">{t("onboardingCardWalletDescription")}</p>
              </div>
              <span className={`badge badge--${walletBadgeTone}`}>{walletStatusLabel}</span>
            </div>

            <div className={`wallet-card ${walletConnected ? "wallet-card--connected" : ""}`}>
              <div>
                <strong>
                  {walletConnected
                    ? `${valueOrFallback(state.wallet.provider, "Phantom")} wallet`
                    : t("onboardingWalletAction")}
                </strong>
                <p>{walletMicrocopy}</p>
                <small>
                  {walletConnected
                    ? `${t("onboardingMainWalletLabel")}: ${valueOrFallback(
                        shortenPublicKey(state.wallet.mainWalletPublicKey),
                        t("onboardingValueNotConnected"),
                      )}`
                    : t("onboardingWalletActionHint")}
                </small>
              </div>
              <button
                className="btn secondary"
                onClick={() => void (walletConnected ? disconnectWallet() : connectWallet())}
                type="button"
              >
                {walletConnected
                  ? t("onboardingWalletActionDisconnect")
                  : t("onboardingWalletAction")}
              </button>
            </div>

            {state.wallet.errorCode ? (
              <div className="status-row status-row--danger">
                <span className="status-dot status-dot--danger"></span>
                <div>
                  <strong>{t("onboardingWalletErrorLabel")}</strong>
                  <p>{walletErrorMessage ?? state.wallet.errorCode}</p>
                </div>
              </div>
            ) : null}
          </section>

          <section className="panel keys-panel">
            <div className="row-between align-start section-gap">
              <div>
                <p className="panel-label">{t("onboardingCardCredentialsEyebrow")}</p>
                <h3>{t("onboardingCardCredentialsTitle")}</h3>
                <p className="panel-copy">{t("onboardingCardCredentialsDescription")}</p>
              </div>
              <span className={`badge badge--${credentialBadgeTone}`}>{credentialStatusLabel}</span>
            </div>

            <div className="onboarding-form">
              <label className="onboarding-form__field">
                <span>{t("onboardingMainWalletLabel")}</span>
                <input
                  className="onboarding-form__input"
                  readOnly
                  value={valueOrFallback(
                    state.wallet.mainWalletPublicKey,
                    t("onboardingFormMainWalletLocked"),
                  )}
                />
                <small>{t("onboardingHelperMainWallet")}</small>
              </label>

              <label className="onboarding-form__field">
                <span>{t("onboardingAgentWalletPublicLabel")}</span>
                <input
                  className="onboarding-form__input"
                  onChange={(event) =>
                    updateCredentialField("agentWalletPublicKey", event.target.value)
                  }
                  placeholder={t("onboardingValueAwaitingPublicKey")}
                  value={state.credentials.agentWalletPublicKey ?? ""}
                />
                {fieldErrors.agentWalletPublicKey ? (
                  <em className="onboarding-form__error">
                    {t("onboardingFieldErrorPrefix")}: {fieldErrors.agentWalletPublicKey}
                  </em>
                ) : (
                  <small>{t("onboardingHelperAgentWalletPublic")}</small>
                )}
              </label>

              <label className="onboarding-form__field">
                <span>{t("onboardingAgentWalletPrivateLabel")}</span>
                <textarea
                  className="onboarding-form__input onboarding-form__input--multiline"
                  onChange={(event) =>
                    updateCredentialField("agentWalletPrivateKey", event.target.value)
                  }
                  placeholder={t("onboardingValueAwaitingPrivateKey")}
                  value={state.credentials.agentWalletPrivateKey ?? ""}
                />
                {fieldErrors.agentWalletPrivateKey ? (
                  <em className="onboarding-form__error">
                    {t("onboardingFieldErrorPrefix")}: {fieldErrors.agentWalletPrivateKey}
                  </em>
                ) : (
                  <small>{t("onboardingHelperAgentWalletPrivate")}</small>
                )}
              </label>

              <label className="onboarding-form__field">
                <span>{t("onboardingCredentialAliasLabel")}</span>
                <input
                  className="onboarding-form__input"
                  onChange={(event) =>
                    updateCredentialField("credentialAlias", event.target.value)
                  }
                  placeholder={t("onboardingValueAwaitingAlias")}
                  value={state.credentials.credentialAlias ?? ""}
                />
                <small>{t("onboardingHelperCredentialAlias")}</small>
              </label>
            </div>

            <div className="status-stack">
              <div
                className={`status-row ${
                  walletConnected ? "status-row--success" : "status-row--neutral"
                }`}
              >
                <span
                  className={`status-dot ${
                    walletConnected ? "status-dot--success" : "status-dot--neutral"
                  }`}
                ></span>
                <div>
                  <strong>{walletStatusLabel}</strong>
                  <p>{walletMicrocopy}</p>
                </div>
              </div>

              <div
                className={`status-row ${
                  state.credentials.validationStatus === "valid"
                    ? "status-row--success"
                    : state.credentials.validationStatus === "validating"
                      ? "status-row--info"
                      : state.credentials.validationStatus === "invalid" ||
                          state.credentials.validationStatus === "error"
                        ? "status-row--danger"
                        : "status-row--neutral"
                }`}
              >
                <span
                  className={`status-dot ${
                    state.credentials.validationStatus === "valid"
                      ? "status-dot--success"
                      : state.credentials.validationStatus === "validating"
                        ? "status-dot--info"
                        : state.credentials.validationStatus === "invalid" ||
                            state.credentials.validationStatus === "error"
                          ? "status-dot--danger"
                          : "status-dot--neutral"
                  }`}
                ></span>
                <div>
                  <strong>{credentialFormStateLabel}</strong>
                  <p>{credentialMicrocopy}</p>
                </div>
              </div>
            </div>

            <div className="empty-note">
              <strong>{t("onboardingValidationMessageLabel")}</strong>
              <p>{credentialBanner}</p>
              <small>{validationMessage}</small>
            </div>

            <div className="action-row">
              <button className="btn secondary" onClick={clearCredentialForm} type="button">
                {t("onboardingClearAction")}
              </button>
              <button
                className="btn primary"
                disabled={!walletConnected || state.credentials.validationStatus === "validating"}
                onClick={() => void handleValidateCredentials()}
                type="button"
              >
                {t("onboardingCredentialAction")}
              </button>
            </div>
          </section>

          <section className="panel account-panel">
            <div className="row-between align-start section-gap">
              <div>
                <p className="panel-label">{t("onboardingPanelEyebrow")}</p>
                <h3>{t("onboardingPanelTitle")}</h3>
                <p className="panel-copy">{t("onboardingPanelDescription")}</p>
              </div>
              <span className={`badge badge--${accountBadgeTone}`}>
                {canAccessProduct ? t("onboardingStateAccessReady") : t("onboardingStateAccessBlocked")}
              </span>
            </div>

            <div className="account-state">
              <div className="account-line">
                <span>{t("stateWalletStatus")}</span>
                <strong>{walletStatusLabel}</strong>
              </div>
              <div className="account-line">
                <span>{t("stateCredentialStatus")}</span>
                <strong>{credentialStatusLabel}</strong>
              </div>
              <div className="account-line">
                <span>{t("stateAccessStatus")}</span>
                <strong>{canAccessProduct ? t("stateAccessGranted") : t("stateAccessBlocked")}</strong>
              </div>
            </div>

            <div className="empty-note">
              <strong>{t("onboardingFinalCta")}</strong>
              <p>
                {canAccessProduct
                  ? t("onboardingFinalCtaHintReady")
                  : t("onboardingFinalCtaHintBlocked")}
              </p>
            </div>

            <button
              className="btn primary wide"
              disabled={!canAccessProduct}
              onClick={() => navigate("/dashboard")}
              type="button"
            >
              {t("onboardingFinalCta")}
            </button>
          </section>
        </section>
      </main>
    </div>
  );
}
