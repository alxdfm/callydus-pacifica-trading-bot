import { useState } from "react";
import type {
  PacificaCredentialValidationResponse,
  PacificaValidationErrorCode,
  PacificaOperationalVerificationResponse,
} from "@pacifica/contracts";
import { applyOperationalProfileSessionSnapshot } from "../account/apply-operational-page-sessions";
import { readOperationalProfileViaBackend } from "../account/backend-operational-page-sessions";
import { validateAgentWalletViaBackend } from "../onboarding/backend-credential-validation";
import { verifyAgentWalletOperationallyViaBackend } from "../onboarding/backend-operational-verification";
import { pauseBotViaBackend } from "../runtime/backend-bot-commands";
import { useAuth } from "../auth/AuthContext";
import { useI18n } from "../../shared/i18n/I18nProvider";
import { useAppState } from "../../state/app-state";

type FieldErrors = {
  agentWalletPublicKey?: string;
  agentWalletPrivateKey?: string;
};

type ModalFeedbackTone = "danger" | "success" | "info";

type ValidatedDraftState = {
  credentialId: string;
  keyFingerprint: string;
  validatedAt: string;
  agentWalletPublicKey: string;
  agentWalletPrivateKey: string;
  credentialAlias: string | null;
};

function mapValidationCodeField(
  code: PacificaValidationErrorCode | null | undefined,
): keyof FieldErrors | null {
  if (code === "invalid_agent_wallet_format" || code === "agent_wallet_mismatch") {
    return "agentWalletPublicKey";
  }

  if (code === "invalid_agent_wallet_secret") {
    return "agentWalletPrivateKey";
  }

  return null;
}

function maskSecret(secret: string | null | undefined): string {
  if (!secret) {
    return "";
  }

  return "*".repeat(secret.length);
}

export function useAgentWalletReplacementFlow() {
  const { t } = useI18n();
  const { token } = useAuth();
  const {
    setBuilderApprovalState,
    setCredentialState,
    setOnboardingState,
    setOperationalState,
    setPresetState,
    setRuntimeState,
    state,
  } = useAppState();
  const [isDraftValidating, setIsDraftValidating] = useState(false);
  const [isDraftVerifying, setIsDraftVerifying] = useState(false);
  const [isReplacementCompleted, setIsReplacementCompleted] = useState(false);
  const [hasStartedReplacementFlow, setHasStartedReplacementFlow] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [modalFeedback, setModalFeedback] = useState<string | null>(null);
  const [modalFeedbackTone, setModalFeedbackTone] = useState<ModalFeedbackTone | null>(null);
  const [validatedDraft, setValidatedDraft] = useState<ValidatedDraftState | null>(null);
  const [draftPublicKey, setDraftPublicKey] = useState(
    state.credentials.agentWalletPublicKey ?? "",
  );
  const [draftPrivateKey, setDraftPrivateKey] = useState("");
  const [draftAlias, setDraftAlias] = useState(state.credentials.credentialAlias ?? "");

  const trimmedDraftPublicKey = draftPublicKey.trim();
  const trimmedDraftPrivateKey = draftPrivateKey.trim();
  const trimmedDraftAlias = draftAlias.trim();
  const isBotRunning =
    state.runtime.botStatus === "active" || state.runtime.botStatus === "syncing";
  const criticalEditBlocked = isBotRunning;
  const canValidateAgentWallet =
    !criticalEditBlocked &&
    !isReplacementCompleted &&
    !validatedDraft &&
    Boolean(state.wallet.mainWalletPublicKey) &&
    Boolean(trimmedDraftPublicKey) &&
    Boolean(trimmedDraftPrivateKey) &&
    state.builderApproval.approvalStatus === "approved" &&
    !isDraftValidating;
  const canRunOperationalCheck =
    !isReplacementCompleted && Boolean(validatedDraft?.credentialId) && !isDraftVerifying;
  const shouldLockReplacementInputs = Boolean(validatedDraft) || isReplacementCompleted;
  const privateKeyFieldValue = isReplacementCompleted
    ? maskSecret(draftPrivateKey)
    : validatedDraft
      ? maskSecret(validatedDraft.agentWalletPrivateKey)
      : draftPrivateKey;

  function resetDrafts() {
    setDraftPublicKey(state.credentials.agentWalletPublicKey ?? "");
    setDraftPrivateKey("");
    setDraftAlias(state.credentials.credentialAlias ?? "");
    setFieldErrors({});
    setModalFeedback(null);
    setModalFeedbackTone(null);
    setValidatedDraft(null);
    setIsDraftValidating(false);
    setIsDraftVerifying(false);
    setIsReplacementCompleted(false);
    setHasStartedReplacementFlow(false);
  }

  function setFieldErrorsFromCode(
    invalidField: keyof FieldErrors | null,
    message: string,
  ) {
    const nextErrors: FieldErrors = {};

    if (invalidField === "agentWalletPublicKey") {
      nextErrors.agentWalletPublicKey = message;
    }

    if (invalidField === "agentWalletPrivateKey") {
      nextErrors.agentWalletPrivateKey = message;
    }

    setFieldErrors(nextErrors);
  }

  function clearPendingValidation() {
    setValidatedDraft(null);
    setModalFeedback(null);
    setModalFeedbackTone(null);
    setIsReplacementCompleted(false);
  }

  function updateDraftPublicKey(value: string) {
    setDraftPublicKey(value);
    clearPendingValidation();
  }

  function updateDraftPrivateKey(value: string) {
    setDraftPrivateKey(value);
    clearPendingValidation();
  }

  function updateDraftAlias(value: string) {
    setDraftAlias(value);
    clearPendingValidation();
  }

  async function handleStopBot() {
    setHasStartedReplacementFlow(true);
    const walletAddress = state.wallet.mainWalletPublicKey;

    if (!walletAddress) {
      setModalFeedback("Connect the main wallet before stopping the bot.");
      setModalFeedbackTone("danger");
      return;
    }

    setRuntimeState({
      screenStatus: "loading",
      lastRuntimeMessage: null,
    });

    const commandResult = await pauseBotViaBackend({ walletAddress }, token);

    if (commandResult.status === "error") {
      setRuntimeState({
        screenStatus: "ready",
        actionToast: {
          id: Date.now(),
          tone: "danger",
          message: commandResult.message,
        },
      });
      setModalFeedback(commandResult.message);
      setModalFeedbackTone("danger");
      return;
    }

    const sessionSnapshot = await readOperationalProfileViaBackend({
      walletAddress,
    }, token);

    if (sessionSnapshot.status === "found") {
      applyOperationalProfileSessionSnapshot(sessionSnapshot, {
        setBuilderApprovalState,
        setCredentialState,
        setOperationalState,
        setPresetState,
        setRuntimeState,
      });
      setModalFeedback("Bot paused successfully. You can now validate the replacement Agent Wallet.");
      setModalFeedbackTone("info");
      return;
    }

    const fallbackMessage =
      sessionSnapshot.status === "error"
        ? sessionSnapshot.message
        : "Could not refresh the account session after pausing the bot.";
    setRuntimeState({
      screenStatus: "error",
      lastRuntimeMessage: fallbackMessage,
    });
    setModalFeedback(fallbackMessage);
    setModalFeedbackTone("danger");
  }

  function applyValidationResponse(response: PacificaCredentialValidationResponse) {
    if (response.canProceed) {
      setFieldErrors({});
      setValidatedDraft({
        credentialId: response.credentialId,
        keyFingerprint: response.keyFingerprint,
        validatedAt: response.validatedAt,
        agentWalletPublicKey: trimmedDraftPublicKey,
        agentWalletPrivateKey: trimmedDraftPrivateKey,
        credentialAlias: trimmedDraftAlias || null,
      });
      setModalFeedback(t("profileAgentWalletValidated"));
      setModalFeedbackTone("success");
      return;
    }

    const invalidField = mapValidationCodeField(response.code);
    setValidatedDraft(null);
    setFieldErrorsFromCode(invalidField, response.message);
    setModalFeedback(response.message);
    setModalFeedbackTone("danger");
  }

  async function handleValidateAgentWallet() {
    setHasStartedReplacementFlow(true);
    const nextErrors: FieldErrors = {};

    if (!trimmedDraftPublicKey) {
      nextErrors.agentWalletPublicKey = "Agent Wallet public key is required.";
    }

    if (!trimmedDraftPrivateKey) {
      nextErrors.agentWalletPrivateKey = "Agent Wallet private key is required.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setValidatedDraft(null);
      setFieldErrors(nextErrors);
      return;
    }

    if (!state.wallet.mainWalletPublicKey) {
      setValidatedDraft(null);
      setModalFeedback("Connect the main wallet before validating the Agent Wallet.");
      setModalFeedbackTone("danger");
      return;
    }

    if (state.builderApproval.approvalStatus !== "approved") {
      setValidatedDraft(null);
      setModalFeedback("Approve the builder code before validating the Agent Wallet.");
      setModalFeedbackTone("danger");
      return;
    }

    setFieldErrors({});
    setModalFeedback(null);
    setModalFeedbackTone(null);
    setValidatedDraft(null);
    setIsDraftValidating(true);

    const response = await validateAgentWalletViaBackend({
      mainWalletPublicKey: state.wallet.mainWalletPublicKey,
      agentWalletPublicKey: trimmedDraftPublicKey,
      agentWalletPrivateKey: trimmedDraftPrivateKey,
      credentialAlias: trimmedDraftAlias || null,
    });

    setIsDraftValidating(false);
    applyValidationResponse(response);
  }

  function applyOperationalResponse(
    response: PacificaOperationalVerificationResponse,
  ) {
    if (!validatedDraft) {
      return;
    }

    if (response.canProceed) {
      setCredentialState({
        agentWalletPublicKey: validatedDraft.agentWalletPublicKey,
        agentWalletPrivateKey: null,
        credentialAlias: validatedDraft.credentialAlias,
        credentialId: validatedDraft.credentialId,
        keyFingerprint: validatedDraft.keyFingerprint,
        validationStatus: "valid",
        lastValidatedAt: validatedDraft.validatedAt,
        lastErrorCode: null,
        lastValidationMessage: t("profileAgentWalletValidated"),
        retryable: false,
      });
      setOperationalState({
        status: "verified",
        lastVerifiedAt: response.verifiedAt,
        lastErrorCode: null,
        lastMessage: "Operational verification completed successfully.",
        retryable: false,
        probeSymbol: response.probeSymbol,
        probeClientOrderId: response.probeClientOrderId,
      });
      setOnboardingState({
        status: "ready",
        accountReady: true,
        showCompletionModal: false,
      });
      setDraftPublicKey(validatedDraft.agentWalletPublicKey);
      setDraftPrivateKey(validatedDraft.agentWalletPrivateKey);
      setDraftAlias(validatedDraft.credentialAlias ?? "");
      setFieldErrors({});
      setValidatedDraft(null);
      setIsReplacementCompleted(true);
      setModalFeedback(t("profileAgentWalletReplacementCompleted"));
      setModalFeedbackTone("success");
      return;
    }

    setModalFeedback(response.message);
    setModalFeedbackTone("danger");
  }

  async function handleRunReadinessCheck() {
    setHasStartedReplacementFlow(true);

    if (!validatedDraft?.credentialId) {
      setModalFeedback("Validate the Agent Wallet before running the readiness check.");
      setModalFeedbackTone("danger");
      return;
    }

    if (
      validatedDraft.credentialId === state.credentials.credentialId &&
      state.operational.status === "verified"
    ) {
      setCredentialState({
        agentWalletPublicKey: validatedDraft.agentWalletPublicKey,
        agentWalletPrivateKey: null,
        credentialAlias: validatedDraft.credentialAlias,
        credentialId: validatedDraft.credentialId,
        keyFingerprint: validatedDraft.keyFingerprint,
        validationStatus: "valid",
        lastValidatedAt: validatedDraft.validatedAt,
        lastErrorCode: null,
        lastValidationMessage: t("profileAgentWalletValidated"),
        retryable: false,
      });
      setDraftPublicKey(validatedDraft.agentWalletPublicKey);
      setDraftPrivateKey(validatedDraft.agentWalletPrivateKey);
      setDraftAlias(validatedDraft.credentialAlias ?? "");
      setFieldErrors({});
      setValidatedDraft(null);
      setIsReplacementCompleted(true);
      setModalFeedback(t("profileAgentWalletVerificationReuse"));
      setModalFeedbackTone("success");
      return;
    }

    setIsDraftVerifying(true);
    setModalFeedback(null);
    setModalFeedbackTone(null);

    const response = await verifyAgentWalletOperationallyViaBackend({
      credentialId: validatedDraft.credentialId,
    });

    setIsDraftVerifying(false);
    applyOperationalResponse(response);
  }

  return {
    canRunOperationalCheck,
    canValidateAgentWallet,
    clearPendingValidation,
    criticalEditBlocked,
    draftAlias,
    draftPrivateKey,
    draftPublicKey,
    fieldErrors,
    handleRunReadinessCheck,
    handleStopBot,
    handleValidateAgentWallet,
    hasStartedReplacementFlow,
    isBotRunning,
    isDraftValidating,
    isDraftVerifying,
    isReplacementCompleted,
    modalFeedback,
    modalFeedbackTone,
    privateKeyFieldValue,
    resetDrafts,
    setDraftAlias: updateDraftAlias,
    setDraftPrivateKey: updateDraftPrivateKey,
    setDraftPublicKey: updateDraftPublicKey,
    shouldLockReplacementInputs,
    validatedDraft,
  };
}
