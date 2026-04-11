import { useCallback, useState } from "react";
import type { OperationalProfileSessionFound } from "@pacifica/contracts";
import { useNavigate } from "react-router-dom";
import { applyOperationalProfileSessionSnapshot } from "../../features/account/apply-operational-page-sessions";
import { readOperationalProfileViaBackend } from "../../features/account/backend-operational-page-sessions";
import { useOperationalPageSession } from "../../features/account/use-operational-page-session";
import { useAgentWalletReplacementFlow } from "../../features/profile/use-agent-wallet-replacement-flow";
import { useSolanaWalletPort } from "../../features/wallet/solana/SolanaWalletEnvironment";
import { useI18n } from "../../shared/i18n/I18nProvider";
import { useAppState } from "../../state/app-state";
import { ConfirmationModal } from "../components/ConfirmationModal";

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

function formatWalletProvider(value: string | null) {
  if (value === "phantom") {
    return "Phantom";
  }

  if (value === "backpack") {
    return "Backpack";
  }

  return value ?? "Phantom";
}

function deriveAgentWalletBadgeState(
  hasCredentialKeyChanges: boolean,
  validationStatus: ReturnType<
    typeof useAppState
  >["state"]["credentials"]["validationStatus"],
  t: ReturnType<typeof useI18n>["t"],
) {
  if (hasCredentialKeyChanges) {
    return {
      agentWalletStatus: t("profileAgentWalletStatusEditing"),
      agentWalletTone: "warning" as const,
    };
  }

  switch (validationStatus) {
    case "valid":
      return {
        agentWalletStatus: t("profileAgentWalletStatusValidated"),
        agentWalletTone: "success" as const,
      };
    case "validating":
      return {
        agentWalletStatus: t("profileAgentWalletStatusValidating"),
        agentWalletTone: "warning" as const,
      };
    case "pending":
      return {
        agentWalletStatus: t("profileAgentWalletStatusUnchanged"),
        agentWalletTone: "neutral" as const,
      };
    default:
      return {
        agentWalletStatus: t("profileAgentWalletStatusInvalid"),
        agentWalletTone: "danger" as const,
      };
  }
}

export function ProfilePage() {
  const navigate = useNavigate();
  const { disconnectWallet } = useSolanaWalletPort();
  const {
    resetOnboardingState,
    setBuilderApprovalState,
    setCredentialState,
    setOnboardingState,
    setOperationalState,
    setPresetState,
    setRuntimeState,
    state,
  } = useAppState();
  const { t } = useI18n();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isAgentWalletModalOpen, setIsAgentWalletModalOpen] = useState(false);
  const [isEndingSession, setIsEndingSession] = useState(false);
  const replacementFlow = useAgentWalletReplacementFlow();
  const applyProfileSnapshot = useCallback(
    (snapshot: OperationalProfileSessionFound) => {
      applyOperationalProfileSessionSnapshot(snapshot, {
        setBuilderApprovalState,
        setCredentialState,
        setOperationalState,
        setPresetState,
        setRuntimeState,
        setOnboardingState,
      });
    },
    [
      setBuilderApprovalState,
      setCredentialState,
      setOnboardingState,
      setOperationalState,
      setPresetState,
      setRuntimeState,
    ],
  );
  const profileSession = useOperationalPageSession({
    readSnapshot: readOperationalProfileViaBackend,
    applySnapshot: applyProfileSnapshot,
    requestKey: "profile",
    loadingMessage: t("runtimeStatusLoading"),
    unavailableMessage: t("runtimeStatusError"),
  });

  const hasCredentialKeyChanges =
    isAgentWalletModalOpen &&
    (replacementFlow.draftPublicKey.trim() !==
      (state.credentials.agentWalletPublicKey ?? "") ||
      replacementFlow.draftPrivateKey.trim().length > 0);
  const { agentWalletStatus, agentWalletTone } = deriveAgentWalletBadgeState(
    hasCredentialKeyChanges,
    state.credentials.validationStatus,
    t,
  );
  const botStatusBadgeTone = replacementFlow.isBotRunning
    ? "warning"
    : "neutral";

  function openAgentWalletModal() {
    replacementFlow.resetDrafts();
    setIsAgentWalletModalOpen(true);
  }

  function closeAgentWalletModal() {
    setIsAgentWalletModalOpen(false);
    replacementFlow.resetDrafts();
  }

  async function handleLogout() {
    setIsLogoutModalOpen(false);
    setIsEndingSession(true);

    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem("pacifica.dashboard-flash");
      window.localStorage.removeItem("pacifica.app-state");
      window.localStorage.removeItem("walletName");
    }

    resetOnboardingState();

    try {
      await disconnectWallet();
    } catch {
      // Shared wallet state already reflects disconnect failures.
    } finally {
      setIsEndingSession(false);
      navigate("/onboarding", { replace: true });
    }
  }

  return (
    <div className="page-stack">
      <ConfirmationModal
        cancelLabel={t("modalCancelAction")}
        confirmLabel={t("profileLogoutAction")}
        description={t("profileLogoutConfirmDescription")}
        isOpen={isLogoutModalOpen}
        onCancel={() => setIsLogoutModalOpen(false)}
        onConfirm={() => void handleLogout()}
        title={t("profileLogoutConfirmTitle")}
        tone="danger"
      />

      {isAgentWalletModalOpen ? (
        <div
          className="modal-overlay"
          onClick={closeAgentWalletModal}
          role="presentation"
        >
          <div
            aria-modal="true"
            className="modal-card profile-maintenance-modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
          >
            <div className="modal-copy">
              <p className="panel-label">{t("profileAgentWalletEyebrow")}</p>
              <h3>{t("profileAgentWalletTitle")}</h3>
              <p>{t("profileAgentWalletDescription")}</p>
            </div>

            <div className="form-stack">
              <label className="onboarding-form__field">
                <span>{t("profileAgentWalletPublicKeyLabel")}</span>
                <input
                  className="onboarding-form__input"
                  disabled={
                    replacementFlow.criticalEditBlocked ||
                    replacementFlow.isDraftValidating ||
                    replacementFlow.isDraftVerifying ||
                    replacementFlow.shouldLockReplacementInputs
                  }
                  onChange={(event) =>
                    replacementFlow.setDraftPublicKey(event.target.value)
                  }
                  value={replacementFlow.draftPublicKey}
                />
                {replacementFlow.fieldErrors.agentWalletPublicKey ? (
                  <small className="onboarding-form__error">
                    {replacementFlow.fieldErrors.agentWalletPublicKey}
                  </small>
                ) : null}
              </label>
              <label className="onboarding-form__field">
                <span>{t("profileAgentWalletPrivateKeyLabel")}</span>
                <input
                  className="onboarding-form__input"
                  disabled={
                    replacementFlow.criticalEditBlocked ||
                    replacementFlow.isDraftValidating ||
                    replacementFlow.isDraftVerifying ||
                    replacementFlow.shouldLockReplacementInputs
                  }
                  type={
                    replacementFlow.validatedDraft ||
                    replacementFlow.isReplacementCompleted
                      ? "text"
                      : "password"
                  }
                  onChange={(event) =>
                    replacementFlow.setDraftPrivateKey(event.target.value)
                  }
                  placeholder={t("profileAgentWalletPrivateKeyPlaceholder")}
                  value={replacementFlow.privateKeyFieldValue}
                />
                <small>{t("profileAgentWalletPrivateKeyHint")}</small>
                {replacementFlow.fieldErrors.agentWalletPrivateKey ? (
                  <small className="onboarding-form__error">
                    {replacementFlow.fieldErrors.agentWalletPrivateKey}
                  </small>
                ) : null}
              </label>
              <label className="onboarding-form__field">
                <span>{`${t("profileCredentialAliasLabel")} (${t("profileOptionalLabel")})`}</span>
                <input
                  className="onboarding-form__input"
                  disabled={
                    replacementFlow.isDraftValidating ||
                    replacementFlow.isDraftVerifying ||
                    replacementFlow.shouldLockReplacementInputs
                  }
                  onChange={(event) =>
                    replacementFlow.setDraftAlias(event.target.value)
                  }
                  value={replacementFlow.draftAlias}
                />
              </label>
            </div>

            {replacementFlow.criticalEditBlocked ? (
              <div className="info-note">
                <strong>{t("profileCriticalEditBlockedTitle")}</strong>
                <p>{t("profileCriticalEditBlockedDescription")}</p>
              </div>
            ) : null}

            {!replacementFlow.hasStartedReplacementFlow ? (
              <div className="done-note">
                <strong>{t("profileRevalidationRequiredTitle")}</strong>
                <p>{t("profileRevalidationRequiredDescription")}</p>
              </div>
            ) : null}

            {replacementFlow.modalFeedback ? (
              replacementFlow.validatedDraft ||
              replacementFlow.isReplacementCompleted ||
              replacementFlow.modalFeedbackTone === "success" ||
              replacementFlow.modalFeedbackTone === "info" ? (
                <div className="done-note">
                  <strong>
                    {replacementFlow.isReplacementCompleted
                      ? replacementFlow.modalFeedback ===
                        t("profileAgentWalletVerificationReuse")
                        ? t("profileAgentWalletVerificationReuseTitle")
                        : t("profileAgentWalletReplacementCompletedTitle")
                      : replacementFlow.modalFeedbackTone === "info"
                        ? t("profilePauseBotCompletedTitle")
                      : t("profileAgentWalletValidatedTitle")}
                  </strong>
                  <p>{replacementFlow.modalFeedback}</p>
                </div>
              ) : (
                <div className="status-row status-row--danger">
                  <span className="status-dot status-dot--danger"></span>
                  <div>
                    <strong>{t("profileAgentWalletValidationFailed")}</strong>
                    <p>{replacementFlow.modalFeedback}</p>
                  </div>
                </div>
              )
            ) : null}

            <div className="action-row">
              <button
                className="btn danger"
                disabled={
                  !replacementFlow.isBotRunning ||
                  replacementFlow.isReplacementCompleted
                }
                onClick={() => void replacementFlow.handleStopBot()}
                type="button"
              >
                {t("profilePauseBotAction")}
              </button>
              <button
                className="btn secondary"
                disabled={!replacementFlow.canValidateAgentWallet}
                onClick={() => void replacementFlow.handleValidateAgentWallet()}
                type="button"
              >
                {t("profileAgentWalletValidateAction")}
              </button>
              <button
                className="btn primary"
                disabled={!replacementFlow.canRunOperationalCheck}
                onClick={() => void replacementFlow.handleRunReadinessCheck()}
                type="button"
              >
                {t("profileAgentWalletOperationalAction")}
              </button>
            </div>

            <div className="action-row modal-actions">
              <button
                className="btn secondary"
                onClick={closeAgentWalletModal}
                type="button"
              >
                {t("modalCloseAction")}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <section className="topbar">
        <div>
          <p className="page-card__eyebrow">{t("navProfile")}</p>
          <h2>{t("profileTopbarTitle")}</h2>
          <p className="subtle">{t("profileTopbarDescription")}</p>
        </div>
        <div className="topbar-actions">
          <button
            className="btn danger"
            disabled={isEndingSession}
            onClick={() => setIsLogoutModalOpen(true)}
            type="button"
          >
            {t("profileLogoutAction")}
          </button>
        </div>
      </section>

      {profileSession.status === "loading" || profileSession.status === "error" ? (
        <section
          className={`page-card status-banner status-banner--${
            profileSession.status === "error" ? "danger" : "warning"
          }`}
        >
          <strong>
            {profileSession.status === "error"
              ? t("runtimeStatusError")
              : t("runtimeStatusLoading")}
          </strong>
          <p>{profileSession.message}</p>
        </section>
      ) : null}

      <section className="dashboard-grid profile-grid">
        <section className="panel hero-panel-wide">
          <div className="row-between align-start">
            <div>
              <p className="panel-label">{t("profileMainWalletEyebrow")}</p>
              <h3>{t("profileMainWalletTitle")}</h3>
              <p className="subtle">{t("profileMainWalletDescription")}</p>
            </div>
            <span className="badge badge--neutral">
              {t("profileMainWalletReadonlyBadge")}
            </span>
          </div>

          <div className="form-stack">
            <label className="onboarding-form__field">
              <span>{t("profileWalletProviderLabel")}</span>
              <input
                className="onboarding-form__input"
                readOnly
                value={formatWalletProvider(state.wallet.provider)}
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
        </section>

        <section className="panel trades-panel">
          <div className="row-between align-start section-gap">
            <div>
              <p className="panel-label">{t("profileAgentWalletEyebrow")}</p>
              <h3>{t("profileAgentWalletCurrentTitle")}</h3>
              <p className="subtle">
                {t("profileAgentWalletCurrentDescription")}
              </p>
            </div>
            <div className="topbar-actions">
              <span className={`badge badge--${agentWalletTone}`}>
                {agentWalletStatus}
              </span>
              <button
                className="btn secondary"
                onClick={openAgentWalletModal}
                type="button"
              >
                {t("profileAgentWalletEditAction")}
              </button>
            </div>
          </div>

          <div className="form-stack">
            <label className="onboarding-form__field">
              <span>{t("profileAgentWalletPublicKeyLabel")}</span>
              <input
                className="onboarding-form__input"
                readOnly
                value={state.credentials.agentWalletPublicKey ?? ""}
              />
            </label>
            <label className="onboarding-form__field">
              <span>{`${t("profileCredentialAliasLabel")} (${t("profileOptionalLabel")})`}</span>
              <input
                className="onboarding-form__input"
                readOnly
                value={state.credentials.credentialAlias ?? ""}
              />
            </label>
          </div>

          <p className="subtle">
            {state.credentials.lastValidationMessage ??
              formatRelativeValidation(
                state.credentials.lastValidatedAt,
                t("stateEmptyValue"),
              )}
          </p>
        </section>
      </section>
    </div>
  );
}
