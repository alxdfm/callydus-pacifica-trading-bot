import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { validateAgentWalletLocally } from "../../features/onboarding/agent-wallet-validation";
import { useSolanaWalletPort } from "../../features/wallet/solana/SolanaWalletEnvironment";
import { useI18n } from "../../shared/i18n/I18nProvider";
import { useAppState } from "../../state/app-state";
import { ConfirmationModal } from "../components/ConfirmationModal";

type FieldErrors = {
  agentWalletPublicKey?: string;
  agentWalletPrivateKey?: string;
};

function formatRelativeValidation(value: string | null, fallback: string) {
  if (!value) {
    return fallback;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return fallback;
  }

  return date.toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ProfilePage() {
  const navigate = useNavigate();
  const { connectWallet, disconnectWallet } = useSolanaWalletPort();
  const {
    canAccessProduct,
    setCredentialState,
    setOnboardingState,
    setOperationalState,
    state,
  } = useAppState();
  const { t } = useI18n();
  const [isReconnectModalOpen, setIsReconnectModalOpen] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [draftPublicKey, setDraftPublicKey] = useState(state.credentials.agentWalletPublicKey ?? "");
  const [draftPrivateKey, setDraftPrivateKey] = useState("");
  const [draftAlias, setDraftAlias] = useState(state.credentials.credentialAlias ?? "");

  const hasCredentialKeyChanges =
    draftPublicKey.trim() !== (state.credentials.agentWalletPublicKey ?? "") ||
    draftPrivateKey.trim().length > 0;
  const hasAliasChange = draftAlias.trim() !== (state.credentials.credentialAlias ?? "");
  const hasAnyDraftChange = hasCredentialKeyChanges || hasAliasChange;

  const accountStatus = canAccessProduct
    ? t("profileAccountReady")
    : state.credentials.validationStatus === "validating"
      ? t("profileAccountNeedsValidation")
      : t("profileAccountAttention");
  const accountStatusCopy = canAccessProduct
    ? t("profileStatusOperationalUnlocked")
    : state.credentials.validationStatus === "validating"
      ? t("profileStatusTemporaryLock")
      : t("profileStatusAttentionCopy");
  const agentWalletStatus = hasAnyDraftChange
    ? t("profileAgentWalletStatusEditing")
    : state.credentials.validationStatus === "valid"
      ? t("profileAgentWalletStatusValidated")
      : state.credentials.validationStatus === "validating"
        ? t("profileAgentWalletStatusValidating")
        : state.credentials.validationStatus === "pending"
          ? t("profileAgentWalletStatusUnchanged")
          : t("profileAgentWalletStatusInvalid");
  const agentWalletTone = hasAnyDraftChange
    ? "warning"
    : state.credentials.validationStatus === "valid"
      ? "success"
      : state.credentials.validationStatus === "validating"
        ? "warning"
        : "danger";
  const shortenedWallet = useMemo(() => {
    const key = state.wallet.mainWalletPublicKey;

    if (!key) {
      return "No wallet connected";
    }

    return `${key.slice(0, 4)}...${key.slice(-4)}`;
  }, [state.wallet.mainWalletPublicKey]);

  function resetDrafts() {
    setDraftPublicKey(state.credentials.agentWalletPublicKey ?? "");
    setDraftPrivateKey("");
    setDraftAlias(state.credentials.credentialAlias ?? "");
    setFieldErrors({});
  }

  async function handleReconnectWallet() {
    setIsReconnectModalOpen(false);

    try {
      await disconnectWallet();
    } catch {
      // The wallet bridge already reflects the disconnect failure in shared state.
    }

    await connectWallet();
  }

  async function handleSave() {
    setFieldErrors({});

    if (!hasAnyDraftChange) {
      return;
    }

    if (!hasCredentialKeyChanges) {
      setCredentialState({
        credentialAlias: draftAlias.trim() || null,
        lastValidationMessage: t("profileAliasUpdated"),
      });
      return;
    }

    setCredentialState({
      agentWalletPublicKey: draftPublicKey.trim() || null,
      agentWalletPrivateKey: draftPrivateKey.trim() || null,
      credentialAlias: draftAlias.trim() || null,
      validationStatus: "validating",
      lastErrorCode: null,
      lastValidationMessage: t("profileRevalidationRequiredDescription"),
      retryable: false,
    });
    setOperationalState({
      status: "pending",
      lastVerifiedAt: null,
      lastErrorCode: null,
      lastMessage: null,
      retryable: false,
      probeSymbol: null,
      probeClientOrderId: null,
    });
    setOnboardingState({
      status: "credentials_validating",
      accountReady: false,
    });

    if (!state.wallet.mainWalletPublicKey) {
      setCredentialState({
        validationStatus: "error",
        lastErrorCode: "wallet_not_connected",
        lastValidationMessage: t("onboardingWalletErrorSessionLost"),
        retryable: false,
      });
      setOnboardingState({
        status: "blocked",
        accountReady: false,
      });
      return;
    }

    const response = await validateAgentWalletLocally({
      mainWalletPublicKey: state.wallet.mainWalletPublicKey,
      agentWalletPublicKey: draftPublicKey.trim(),
      agentWalletPrivateKey: draftPrivateKey.trim(),
      credentialAlias: draftAlias.trim() || null,
    });

    if (response.canProceed) {
      setCredentialState({
        agentWalletPublicKey: response.agentWalletPublicKey,
        agentWalletPrivateKey: draftPrivateKey.trim(),
        credentialAlias: draftAlias.trim() || null,
        credentialId: response.credentialId,
        keyFingerprint: response.keyFingerprint,
        validationStatus: "valid",
        lastValidatedAt: response.validatedAt,
        lastErrorCode: null,
        lastValidationMessage: t("profileAgentWalletValidated"),
        retryable: false,
      });
      setOperationalState({
        status: "pending",
        lastVerifiedAt: null,
        lastErrorCode: null,
        lastMessage: null,
        retryable: false,
        probeSymbol: null,
        probeClientOrderId: null,
      });
      setOnboardingState({
        status: "credentials_pending",
        accountReady: false,
      });
      setDraftPrivateKey("");
      setFieldErrors({});
      return;
    }

    setCredentialState({
      agentWalletPublicKey: draftPublicKey.trim() || null,
      agentWalletPrivateKey: draftPrivateKey.trim() || null,
      credentialAlias: draftAlias.trim() || null,
      validationStatus: response.status === "error" ? "error" : "invalid",
      lastErrorCode: response.code,
      lastValidationMessage: response.message || t("profileAgentWalletValidationFailed"),
      retryable: response.retryable,
    });
    setOnboardingState({
      status: "blocked",
      accountReady: false,
    });
    setFieldErrors({
      [response.field ?? "agentWalletPrivateKey"]: response.message,
    });
  }

  return (
    <div className="page-stack">
      <ConfirmationModal
        cancelLabel={t("modalCancelAction")}
        confirmLabel={t("profileReconnectWalletAction")}
        description={t("profileReconnectConfirmDescription")}
        isOpen={isReconnectModalOpen}
        onCancel={() => setIsReconnectModalOpen(false)}
        onConfirm={() => void handleReconnectWallet()}
        title={t("profileReconnectConfirmTitle")}
        tone="danger"
      />

      <section className="topbar">
        <div>
          <p className="page-card__eyebrow">{t("navProfile")}</p>
          <h2>{t("profileTopbarTitle")}</h2>
          <p className="subtle">{t("profileTopbarDescription")}</p>
        </div>
        <div className="topbar-actions">
          <span className={`badge badge--${canAccessProduct ? "success" : "warning"}`}>
            {accountStatus}
          </span>
          <button className="btn secondary" onClick={() => navigate("/onboarding")} type="button">
            {t("profileTopbarAction")}
          </button>
        </div>
      </section>

      <section className="metric-grid">
        <article className="stat-panel emphasis">
          <span>{t("profileStatusAccount")}</span>
          <strong>{accountStatus}</strong>
          <p>{accountStatusCopy}</p>
        </article>
        <article className="stat-panel">
          <span>{t("profileStatusMainWallet")}</span>
          <strong>
            {state.wallet.sessionStatus === "connected"
              ? t("onboardingStateWalletConnected")
              : state.wallet.sessionStatus === "reconnecting"
                ? t("onboardingStateWalletReconnecting")
                : t("onboardingStateWalletError")}
          </strong>
          <p>{`${state.wallet.provider ?? "phantom"} ending in ${shortenedWallet}`}</p>
        </article>
        <article className="stat-panel">
          <span>{t("profileStatusAgentWallet")}</span>
          <strong>{agentWalletStatus}</strong>
          <p>{`Alias: ${draftAlias.trim() || state.credentials.credentialAlias || "-"}`}</p>
        </article>
        <article className="stat-panel">
          <span>{t("profileStatusLastValidation")}</span>
          <strong>
            {formatRelativeValidation(state.credentials.lastValidatedAt, t("stateEmptyValue"))}
          </strong>
          <p>{state.credentials.lastValidationMessage ?? t("stateEmptyValue")}</p>
        </article>
      </section>

      <section className="dashboard-grid">
        <section className="panel hero-panel-wide">
          <div className="row-between align-start">
            <div>
              <p className="panel-label">{t("profileMainWalletEyebrow")}</p>
              <h3>{t("profileMainWalletTitle")}</h3>
              <p className="subtle">{t("profileMainWalletDescription")}</p>
            </div>
            <span className="badge badge--neutral">{t("profileMainWalletReadonlyBadge")}</span>
          </div>

          <div className="form-stack">
            <label className="onboarding-form__field">
              <span>{t("profileWalletProviderLabel")}</span>
              <input
                className="onboarding-form__input"
                readOnly
                value={state.wallet.provider ?? "phantom"}
              />
            </label>
            <label className="onboarding-form__field">
              <span>{t("profileMainWalletPublicKeyLabel")}</span>
              <input
                className="onboarding-form__input"
                readOnly
                value={state.wallet.mainWalletPublicKey ?? ""}
              />
              <small>{t("profileMainWalletImpact")}</small>
            </label>
          </div>

          <div className="action-row">
            <button
              className="btn secondary"
              onClick={() => setIsReconnectModalOpen(true)}
              type="button"
            >
              {t("profileReconnectWalletAction")}
            </button>
          </div>
        </section>

        <section className="panel trades-panel">
          <div className="row-between align-start section-gap">
            <div>
              <p className="panel-label">{t("profileAgentWalletEyebrow")}</p>
              <h3>{t("profileAgentWalletTitle")}</h3>
              <p className="subtle">{t("profileAgentWalletDescription")}</p>
            </div>
            <span className={`badge badge--${agentWalletTone}`}>{agentWalletStatus}</span>
          </div>

          <div className="form-stack">
            <label className="onboarding-form__field">
              <span>{t("profileAgentWalletPublicKeyLabel")}</span>
              <input
                className="onboarding-form__input"
                onChange={(event) => setDraftPublicKey(event.target.value)}
                value={draftPublicKey}
              />
              {fieldErrors.agentWalletPublicKey ? (
                <small className="onboarding-form__error">{fieldErrors.agentWalletPublicKey}</small>
              ) : null}
            </label>
            <label className="onboarding-form__field">
              <span>{t("profileAgentWalletPrivateKeyLabel")}</span>
              <input
                className="onboarding-form__input"
                onChange={(event) => setDraftPrivateKey(event.target.value)}
                placeholder={t("profileAgentWalletPrivateKeyPlaceholder")}
                value={draftPrivateKey}
              />
              <small>{t("profileAgentWalletPrivateKeyHint")}</small>
              {fieldErrors.agentWalletPrivateKey ? (
                <small className="onboarding-form__error">{fieldErrors.agentWalletPrivateKey}</small>
              ) : null}
            </label>
            <label className="onboarding-form__field">
              <span>{`${t("profileCredentialAliasLabel")} (${t("profileOptionalLabel")})`}</span>
              <input
                className="onboarding-form__input"
                onChange={(event) => setDraftAlias(event.target.value)}
                value={draftAlias}
              />
            </label>
          </div>

          <div className="status-stack">
            <div className="status-row status-row--info">
              <span className="status-dot status-dot--info"></span>
              <div>
                <strong>{t("profileRevalidationRequiredTitle")}</strong>
                <p>{t("profileRevalidationRequiredDescription")}</p>
              </div>
            </div>
          </div>

          <div className="action-row">
            <button className="btn secondary" onClick={resetDrafts} type="button">
              {t("profileClearChangesAction")}
            </button>
            <button
              className="btn primary"
              disabled={!hasAnyDraftChange || state.credentials.validationStatus === "validating"}
              onClick={() => void handleSave()}
              type="button"
            >
              {t("profileSaveAndRevalidateAction")}
            </button>
          </div>
        </section>

        <section className="panel recent-panel">
          <div className="row-between align-start section-gap">
            <div>
              <p className="panel-label">{t("profileSecurityEyebrow")}</p>
              <h3>{t("profileSecurityTitle")}</h3>
            </div>
            <span className="badge badge--info">{t("profileSecurityBadge")}</span>
          </div>

          <div className="history-list">
            <div className="history-row">
              <div>
                <strong>{t("profileSecurityMainWalletTitle")}</strong>
                <p>{t("profileSecurityMainWalletDescription")}</p>
              </div>
              <strong className="down">{t("profileSecuritySensitive")}</strong>
            </div>
            <div className="history-row">
              <div>
                <strong>{t("profileSecurityAgentWalletTitle")}</strong>
                <p>{t("profileSecurityAgentWalletDescription")}</p>
              </div>
              <strong>{t("profileSecurityReview")}</strong>
            </div>
            <div className="history-row">
              <div>
                <strong>{t("profileSecurityAliasTitle")}</strong>
                <p>{t("profileSecurityAliasDescription")}</p>
              </div>
              <strong className="up">{t("profileSecurityLight")}</strong>
            </div>
          </div>
        </section>
      </section>
    </div>
  );
}
