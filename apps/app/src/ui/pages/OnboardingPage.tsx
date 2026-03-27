import { useEffect, useMemo, useRef, useState } from "react";
import type {
  BuilderApprovalStatus,
  PacificaValidationErrorCode,
  CredentialValidationStatus,
  OnboardingStatus,
  OperationalVerificationStatus,
  PacificaBuilderApprovalResponse,
  PacificaCredentialSubmission,
  PacificaCredentialValidationResponse,
  PacificaOperationalVerificationResponse,
  WalletSession,
} from "@pacifica/contracts";
import { approveBuilderCodeViaBackend } from "../../features/onboarding/backend-builder-approval";
import { validateAgentWalletViaBackend } from "../../features/onboarding/backend-credential-validation";
import { verifyAgentWalletOperationallyViaBackend } from "../../features/onboarding/backend-operational-verification";
import {
  createSignedBuilderApprovalSubmission,
} from "../../features/onboarding/pacifica-builder-approval";
import { useSolanaWalletPort } from "../../features/wallet/solana/SolanaWalletEnvironment";
import { useI18n } from "../../shared/i18n/I18nProvider";
import type { MessageKey } from "../../shared/i18n/messages";
import logoMark from "../../shared/assets/logo.svg";
import { useAppState } from "../../state/app-state";

type ProgressStep = {
  title: string;
  description: string;
  status: "done" | "current" | "locked";
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

function mapCredentialFormState(
  status: CredentialValidationStatus,
  isFilled: boolean,
): MessageKey {
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

function mapBuilderApprovalStatusToMessageKey(
  status: BuilderApprovalStatus,
): MessageKey {
  switch (status) {
    case "approving":
      return "onboardingStateBuilderApproving";
    case "approved":
      return "onboardingStateBuilderApproved";
    case "rejected":
      return "onboardingStateBuilderRejected";
    case "error":
      return "onboardingStateBuilderError";
    default:
      return "onboardingStateBuilderPending";
  }
}

function mapOperationalStatusToMessageKey(
  status: OperationalVerificationStatus,
): MessageKey {
  switch (status) {
    case "verifying":
      return "onboardingStateOperationalRunning";
    case "verified":
      return "onboardingStateOperationalVerified";
    case "blocked":
      return "onboardingStateOperationalBlocked";
    case "error":
      return "onboardingStateOperationalError";
    default:
      return "onboardingStateOperationalPending";
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

function mapBuilderBadgeTone(status: BuilderApprovalStatus): BadgeTone {
  switch (status) {
    case "approved":
      return "success";
    case "approving":
      return "warning";
    case "rejected":
    case "error":
      return "danger";
    default:
      return "neutral";
  }
}

function mapWalletMicrocopy(
  status: WalletSession["sessionStatus"],
): MessageKey {
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

function mapBuilderMicrocopy(
  status: BuilderApprovalStatus,
  retryable: boolean,
): MessageKey {
  switch (status) {
    case "approved":
      return "onboardingBuilderMicrocopyApproved";
    case "approving":
      return "onboardingBuilderMicrocopyApproving";
    case "rejected":
    case "error":
      return retryable
        ? "onboardingBuilderMicrocopyRetry"
        : "onboardingBuilderMicrocopyRejected";
    default:
      return "onboardingBuilderMicrocopyPending";
  }
}

function mapAccountBadgeTone(
  canAccessProduct: boolean,
  status: OnboardingStatus,
  operationalStatus: OperationalVerificationStatus,
): BadgeTone {
  if (canAccessProduct) {
    return "success";
  }

  if (status === "credentials_validating" || operationalStatus === "verifying") {
    return "warning";
  }

  return "neutral";
}

function mapValidationCodeField(code: PacificaValidationErrorCode | null) {
  if (!code) {
    return null;
  }

  if (
    code === "invalid_agent_wallet_format" ||
    code === "agent_wallet_mismatch"
  ) {
    return "agentWalletPublicKey";
  }

  if (code === "invalid_agent_wallet_secret") {
    return "agentWalletPrivateKey";
  }

  return null;
}

function buildProgressSteps(
  walletStatus: WalletSession["sessionStatus"],
  builderStatus: BuilderApprovalStatus,
  credentialStatus: CredentialValidationStatus,
  operationalStatus: OperationalVerificationStatus,
  labels: Pick<ReturnType<typeof useI18n>, "t">["t"],
): ProgressStep[] {
  const walletComplete = walletStatus === "connected";
  const builderComplete = builderStatus === "approved";
  const credentialComplete = credentialStatus === "valid";
  const operationalComplete = operationalStatus === "verified";

  return [
    {
      title: labels("onboardingStepWalletTitle"),
      description: labels("onboardingStepWalletDescription"),
      status: walletComplete ? "done" : "current",
    },
    {
      title: labels("onboardingStepBuilderTitle"),
      description: labels("onboardingStepBuilderDescription"),
      status: builderComplete
        ? "done"
        : walletComplete
          ? "current"
          : "locked",
    },
    {
      title: labels("onboardingStepCredentialsTitle"),
      description: labels("onboardingStepCredentialsDescription"),
      status: credentialComplete
        ? "done"
        : builderComplete
          ? "current"
          : "locked",
    },
    {
      title: labels("onboardingStepOperationalTitle"),
      description: labels("onboardingStepOperationalDescription"),
      status: operationalComplete
        ? "done"
        : credentialComplete
          ? "current"
          : "locked",
    },
  ];
}

function mapOperationalBadgeTone(
  status: OperationalVerificationStatus,
): BadgeTone {
  switch (status) {
    case "verified":
      return "success";
    case "verifying":
      return "warning";
    case "blocked":
    case "error":
      return "danger";
    default:
      return "neutral";
  }
}

function mapOperationalMicrocopy(
  status: OperationalVerificationStatus,
  retryable: boolean,
): MessageKey {
  switch (status) {
    case "verifying":
      return "onboardingOperationalMicrocopyRunning";
    case "verified":
      return "onboardingOperationalMicrocopyVerified";
    case "blocked":
    case "error":
      return retryable
        ? "onboardingOperationalMicrocopyRetry"
        : "onboardingOperationalMicrocopyBlocked";
    default:
      return "onboardingOperationalMicrocopyPending";
  }
}

function deriveVisibleOnboardingStatusKey(input: {
  walletStatus: WalletSession["sessionStatus"];
  builderStatus: BuilderApprovalStatus;
  credentialStatus: CredentialValidationStatus;
  operationalStatus: OperationalVerificationStatus;
  canAccessProduct: boolean;
}): MessageKey {
  if (input.canAccessProduct) {
    return "onboardingStatusReady";
  }

  if (input.walletStatus !== "connected") {
    return "onboardingStatusWalletPending";
  }

  if (input.builderStatus !== "approved") {
    return "onboardingStatusBuilderPending";
  }

  if (input.credentialStatus === "validating") {
    return "onboardingStatusCredentialsValidating";
  }

  if (input.credentialStatus !== "valid") {
    return "onboardingStatusCredentialsPending";
  }

  if (input.operationalStatus === "verifying") {
    return "onboardingStatusOperationalRunning";
  }

  if (input.operationalStatus !== "verified") {
    return "onboardingStatusOperationalPending";
  }

  return "onboardingStatusBlocked";
}

export function OnboardingPage() {
  const {
    canAccessProduct,
    setBuilderApprovalState,
    setCredentialState,
    setOperationalState,
    setOnboardingState,
    state,
  } = useAppState();
  const {
    canSignMessages,
    connectWallet,
    disconnectWallet,
    signWalletMessage,
  } = useSolanaWalletPort();
  const { t } = useI18n();
  const [fieldErrors, setFieldErrors] = useState<FormFieldErrors>({});
  const [selectedStepIndex, setSelectedStepIndex] = useState(0);
  const previousRevealAdditionalStepsRef = useRef(false);
  const previousCurrentStepIndexRef = useRef(0);

  const walletStatusLabel = t(
    mapWalletStatusToMessageKey(state.wallet.sessionStatus),
  );
  const builderStatusLabel = t(
    mapBuilderApprovalStatusToMessageKey(state.builderApproval.approvalStatus),
  );
  const credentialStatusLabel = t(
    mapCredentialStatusToMessageKey(state.credentials.validationStatus),
  );
  const onboardingStatusLabel = t(
    deriveVisibleOnboardingStatusKey({
      walletStatus: state.wallet.sessionStatus,
      builderStatus: state.builderApproval.approvalStatus,
      credentialStatus: state.credentials.validationStatus,
      operationalStatus: state.operational.status,
      canAccessProduct,
    }),
  );
  const walletBadgeTone = mapWalletBadgeTone(state.wallet.sessionStatus);
  const builderBadgeTone = mapBuilderBadgeTone(
    state.builderApproval.approvalStatus,
  );
  const credentialBadgeTone = mapCredentialBadgeTone(
    state.credentials.validationStatus,
  );
  const accountBadgeTone = mapAccountBadgeTone(
    canAccessProduct,
    state.onboarding.status,
    state.operational.status,
  );
  const progressSteps = buildProgressSteps(
    state.wallet.sessionStatus,
    state.builderApproval.approvalStatus,
    state.credentials.validationStatus,
    state.operational.status,
    t,
  );
  const revealAdditionalSteps =
    state.onboarding.accountLookupStatus === "new_account";
  const visibleProgressSteps = revealAdditionalSteps
    ? progressSteps
    : progressSteps.slice(0, 1);
  const completedSteps = visibleProgressSteps.filter(
    (step) => step.status === "done",
  ).length;
  const progressPercent = `${
    (completedSteps / visibleProgressSteps.length) * 100
  }%`;
  const currentStepIndex = Math.max(
    0,
    progressSteps.findIndex((step) => step.status === "current"),
  );
  const currentStepNumber =
    progressSteps.findIndex((step) => step.status === "current") === -1
      ? progressSteps.length
      : currentStepIndex + 1;
  const walletConnected = state.wallet.sessionStatus === "connected";
  const builderApproved = state.builderApproval.approvalStatus === "approved";
  const credentialsValidated = state.credentials.validationStatus === "valid";
  const isCredentialFormFilled = Boolean(
    state.credentials.agentWalletPublicKey?.trim() &&
    state.credentials.agentWalletPrivateKey?.trim(),
  );
  const credentialFormStateLabel = t(
    mapCredentialFormState(
      state.credentials.validationStatus,
      isCredentialFormFilled,
    ),
  );
  const walletMicrocopy = t(mapWalletMicrocopy(state.wallet.sessionStatus));
  const walletErrorMessageKey = mapWalletErrorCodeToMessageKey(
    state.wallet.errorCode,
  );
  const walletErrorMessage = walletErrorMessageKey
    ? t(walletErrorMessageKey)
    : null;
  const builderMicrocopy = t(
    mapBuilderMicrocopy(
      state.builderApproval.approvalStatus,
      state.builderApproval.retryable,
    ),
  );
  const operationalStatusLabel = t(
    mapOperationalStatusToMessageKey(state.operational.status),
  );
  const operationalBadgeTone = mapOperationalBadgeTone(state.operational.status);
  const operationalMicrocopy = t(
    mapOperationalMicrocopy(state.operational.status, state.operational.retryable),
  );
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
  const builderApprovalMessage =
    state.builderApproval.lastMessage ??
    (builderApproved
      ? t("onboardingBuilderApprovalSuccess")
      : t("onboardingBuilderApprovalAwaiting"));
  const operationalMessage =
    state.operational.lastMessage ??
    (state.operational.status === "verified"
      ? t("onboardingOperationalVerifiedMessage")
      : t("onboardingOperationalAwaiting"));
  const isWalletStepDone = progressSteps[0]?.status === "done";
  const isBuilderStepCurrent = progressSteps[1]?.status === "current";
  const isBuilderStepDone = progressSteps[1]?.status === "done";
  const isCredentialStepCurrent = progressSteps[2]?.status === "current";
  const isCredentialStepDone = progressSteps[2]?.status === "done";
  const isCredentialStepLocked = progressSteps[2]?.status === "locked";
  const isOperationalStepCurrent = progressSteps[3]?.status === "current";
  const isOperationalStepDone = progressSteps[3]?.status === "done";
  const isOperationalStepLocked = progressSteps[3]?.status === "locked";

  useEffect(() => {
    if (!revealAdditionalSteps && selectedStepIndex > 0) {
      setSelectedStepIndex(0);
      previousRevealAdditionalStepsRef.current = false;
      return;
    }

    if (
      revealAdditionalSteps &&
      (!previousRevealAdditionalStepsRef.current ||
        currentStepIndex > previousCurrentStepIndexRef.current ||
        selectedStepIndex >= visibleProgressSteps.length)
    ) {
      setSelectedStepIndex(currentStepIndex);
    }

    previousRevealAdditionalStepsRef.current = revealAdditionalSteps;
    previousCurrentStepIndexRef.current = currentStepIndex;
  }, [
    currentStepIndex,
    revealAdditionalSteps,
    selectedStepIndex,
    visibleProgressSteps.length,
  ]);

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
    setOperationalState({
      status: "pending",
      lastVerifiedAt: null,
      lastErrorCode: null,
      lastMessage: null,
      retryable: false,
      probeSymbol: null,
      probeClientOrderId: null,
    });
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

  function resetBuilderAndDependentSteps() {
    setBuilderApprovalState({
      approvalStatus: "pending",
      approvedAt: null,
      lastErrorCode: null,
      lastMessage: null,
      retryable: false,
    });
    setCredentialState({
      credentialId: null,
      keyFingerprint: null,
      validationStatus: "pending",
      lastValidatedAt: null,
      lastErrorCode: null,
      lastValidationMessage: null,
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
      status: walletConnected ? "credentials_pending" : "wallet_pending",
      accountReady: false,
      showCompletionModal: false,
    });
  }

  function resetCredentialAndOperationalSteps() {
    setFieldErrors({});
    setCredentialState({
      credentialId: null,
      keyFingerprint: null,
      validationStatus: "pending",
      lastValidatedAt: null,
      lastErrorCode: null,
      lastValidationMessage: null,
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
      status: builderApproved ? "credentials_pending" : "wallet_pending",
      accountReady: false,
      showCompletionModal: false,
    });
  }

  function resetOperationalStep() {
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
      status: credentialsValidated ? "credentials_pending" : "wallet_pending",
      accountReady: false,
      showCompletionModal: false,
    });
  }

  async function handleEditWalletStep() {
    setFieldErrors({});
    await disconnectWallet();
  }

  function handleEditBuilderStep() {
    resetBuilderAndDependentSteps();
  }

  function handleEditCredentialStep() {
    resetCredentialAndOperationalSteps();
  }

  function handleEditOperationalStep() {
    resetOperationalStep();
  }

  function handleSelectStep(index: number) {
    if (index > 0 && !revealAdditionalSteps) {
      return;
    }

    setSelectedStepIndex(index);
    window.scrollTo({
      behavior: "smooth",
      top: 0,
    });
  }

  async function handleApproveBuilderCode() {
    if (!walletConnected || !state.wallet.mainWalletPublicKey) {
      setBuilderApprovalState({
        approvalStatus: "error",
        lastErrorCode: "wallet_not_connected",
        lastMessage: "Connect the main wallet before approving the builder code.",
        retryable: false,
      });
      return;
    }

    if (!canSignMessages) {
      setBuilderApprovalState({
        approvalStatus: "error",
        lastErrorCode: "wallet_signature_unavailable",
        lastMessage:
          "This wallet does not support message signing for builder approval.",
        retryable: false,
      });
      return;
    }

    setBuilderApprovalState({
      approvalStatus: "approving",
      lastErrorCode: null,
      lastMessage: "Requesting wallet signature for builder approval.",
      retryable: false,
    });

    try {
      const submission = await createSignedBuilderApprovalSubmission({
        mainWalletPublicKey: state.wallet.mainWalletPublicKey,
        signMessage: signWalletMessage,
      });
      const response = await approveBuilderCodeViaBackend(submission);
      applyBuilderApprovalResponse(response);
    } catch (error) {
      console.error("[builder-approval-signing]", error);
      const message =
        error instanceof Error ? error.message : "Could not sign the builder approval payload.";
      const normalizedMessage = message.toLowerCase();
      const rejected =
        normalizedMessage.includes("reject") ||
        normalizedMessage.includes("declin") ||
        normalizedMessage.includes("cancel");
      const unavailable =
        normalizedMessage.includes("unavailable") ||
        normalizedMessage.includes("not supported");

      setBuilderApprovalState({
        approvalStatus: rejected ? "rejected" : "error",
        lastErrorCode: rejected
          ? "wallet_signature_rejected"
          : unavailable
            ? "wallet_signature_unavailable"
            : "internal_error",
        lastMessage: rejected
          ? "The wallet signature request was rejected."
          : message,
        retryable: !unavailable,
      });
    }
  }

  function validateRequiredFields() {
    const nextErrors: FormFieldErrors = {};

    if (!state.credentials.agentWalletPublicKey?.trim()) {
      nextErrors.agentWalletPublicKey = "Agent Wallet public key is required.";
    }

    if (!state.credentials.agentWalletPrivateKey?.trim()) {
      nextErrors.agentWalletPrivateKey =
        "Agent Wallet private key is required.";
    }

    setFieldErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  }

  async function handleValidateCredentials() {
    if (!walletConnected || !state.wallet.mainWalletPublicKey) {
      setCredentialState({
        validationStatus: "error",
        lastErrorCode: "wallet_not_connected",
        lastValidationMessage:
          "Connect the main wallet before validating the Agent Wallet.",
        retryable: false,
      });
      setOnboardingState({
        status: "wallet_pending",
        accountReady: false,
        showCompletionModal: false,
      });
      return;
    }

    if (!builderApproved) {
      setCredentialState({
        validationStatus: "invalid",
        lastErrorCode: "builder_approval_rejected",
        lastValidationMessage:
          "Approve the builder code before validating the Agent Wallet.",
        retryable: false,
      });
      setOnboardingState({
        status: "credentials_pending",
        accountReady: false,
        showCompletionModal: false,
      });
      return;
    }

    if (!validateRequiredFields()) {
      setCredentialState({
        validationStatus: "invalid",
        lastErrorCode: null,
        lastValidationMessage:
          "Complete the required Agent Wallet fields before validating.",
        retryable: false,
      });
      setOnboardingState({
        status: "credentials_pending",
        accountReady: false,
        showCompletionModal: false,
      });
      return;
    }

    setFieldErrors({});
    setCredentialState({
      validationStatus: "validating",
      lastErrorCode: null,
      lastValidationMessage:
        "Validating Agent Wallet via backend and Pacifica.",
      retryable: false,
    });
    setOnboardingState({
      status: "credentials_validating",
      accountReady: false,
      showCompletionModal: false,
    });

    const response = await validateAgentWalletViaBackend({
      mainWalletPublicKey: state.wallet.mainWalletPublicKey,
      agentWalletPublicKey: state.credentials.agentWalletPublicKey ?? "",
      agentWalletPrivateKey: state.credentials.agentWalletPrivateKey ?? "",
      credentialAlias: state.credentials.credentialAlias,
    } satisfies PacificaCredentialSubmission);

    applyValidationResponse(response);
  }

  async function handleRunOperationalCheck() {
    if (!state.credentials.credentialId) {
      setOperationalState({
        status: "blocked",
        lastVerifiedAt: null,
        lastErrorCode: "internal_error",
        lastMessage: "Validate the Agent Wallet before running the readiness check.",
        retryable: false,
        probeSymbol: null,
        probeClientOrderId: null,
      });
      setOnboardingState({
        status: "blocked",
        accountReady: false,
        showCompletionModal: false,
      });
      return;
    }

    setOperationalState({
      status: "verifying",
      lastErrorCode: null,
      lastMessage: "Running a controlled order check through Pacifica.",
      retryable: false,
    });
    setOnboardingState({
      status: "credentials_validating",
      accountReady: false,
      showCompletionModal: false,
    });

    const response = await verifyAgentWalletOperationallyViaBackend({
      credentialId: state.credentials.credentialId,
    });
    applyOperationalVerificationResponse(response);
  }

  function applyValidationResponse(
    response: PacificaCredentialValidationResponse,
  ) {
    if (response.canProceed) {
      setFieldErrors({});
      setCredentialState({
        credentialId: response.credentialId,
        keyFingerprint: response.keyFingerprint,
        validationStatus: "valid",
        lastValidatedAt: response.validatedAt,
        lastErrorCode: null,
        lastValidationMessage:
          "Agent Wallet validated through backend checks.",
        retryable: false,
      });
      setOperationalState({
        status: "pending",
        lastVerifiedAt: null,
        lastErrorCode: null,
        lastMessage: "Run the readiness check to unlock the product.",
        retryable: false,
        probeSymbol: null,
        probeClientOrderId: null,
      });
      setOnboardingState({
        status: "credentials_pending",
        accountReady: false,
        showCompletionModal: false,
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
      status: "blocked",
      accountReady: false,
      showCompletionModal: false,
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
      status: walletConnected ? "credentials_pending" : "wallet_pending",
      accountReady: false,
      showCompletionModal: false,
    });
  }

  function applyBuilderApprovalResponse(
    response: PacificaBuilderApprovalResponse,
  ) {
    if (response.canProceed) {
      setBuilderApprovalState({
        approvalStatus: "approved",
        builderCode: response.builderCode,
        approvedAt: response.approvedAt,
        lastErrorCode: null,
        lastMessage: "Builder code approved for this account.",
        retryable: false,
      });
      setOnboardingState({
        status:
          state.credentials.validationStatus === "valid" &&
          state.operational.status === "verified"
            ? "ready"
            : "credentials_pending",
        accountReady:
          state.credentials.validationStatus === "valid" &&
          state.operational.status === "verified",
        showCompletionModal: false,
      });
      return;
    }

    setBuilderApprovalState({
      approvalStatus: response.status === "rejected" ? "rejected" : "error",
      approvedAt: null,
      lastErrorCode: response.code,
      lastMessage: response.message,
      retryable: response.retryable,
    });
    setOnboardingState({
      status: "credentials_pending",
      accountReady: false,
      showCompletionModal: false,
    });
  }

  function applyOperationalVerificationResponse(
    response: PacificaOperationalVerificationResponse,
  ) {
    if (response.canProceed) {
      setOperationalState({
        status: "verified",
        lastVerifiedAt: response.verifiedAt,
        lastErrorCode: null,
        lastMessage: "Account verified and ready to operate.",
        retryable: false,
        probeSymbol: response.probeSymbol,
        probeClientOrderId: response.probeClientOrderId,
      });
      setOnboardingState({
        status: "ready",
        accountReady: true,
        showCompletionModal: true,
      });
      return;
    }

    setOperationalState({
      status: response.status,
      lastVerifiedAt: null,
      lastErrorCode: response.code,
      lastMessage: response.message,
      retryable: response.retryable,
      probeSymbol: null,
      probeClientOrderId: null,
    });
    setOnboardingState({
      status: "blocked",
      accountReady: false,
      showCompletionModal: false,
    });
  }

  return (
    <div className="onboarding-flow">
      <aside className="onboarding-side">
        <div className="onboarding-brand">
          <img
            alt={`${t("appName")} logo`}
            className="onboarding-brand__logo"
            src={logoMark}
          />
          <div className="onboarding-brand__copy">
            <p className="page-card__eyebrow">{t("appName")}</p>
            <h1>{t("pageOnboardingTitle")}</h1>
          </div>
        </div>

        <div className="onboarding-side__copy">
          <h2>{t("onboardingHeroTitle")}</h2>
        </div>

        <div className="flow-progress">
          <div className="flow-progress__meta">
            <strong>{t("onboardingProgressTitle")}</strong>
            <span>
              {completedSteps} {t("onboardingProgressOf")} {visibleProgressSteps.length}{" "}
              {t("onboardingProgressStepsCompleted")}
            </span>
          </div>
          <div className="flow-progress__track">
            <span
              className="flow-progress__fill"
              style={{ width: progressPercent }}
            ></span>
          </div>
        </div>

        <div className="onboarding-side__steps step-list">
          {visibleProgressSteps.map((step, index) => (
            <button
              key={step.title}
              className={`step-item step-item--button ${step.status} ${
                selectedStepIndex === index ? "step-item--selected" : ""
              }`}
              disabled={step.status === "locked"}
              onClick={() => handleSelectStep(index)}
              type="button"
            >
              <span className="step-index">{index + 1}</span>
              <div className="step-copy">
                <strong>{step.title}</strong>
                <p>{step.description}</p>
                <span className={`step-meta ${step.status}`}>
                  {step.status === "done"
                    ? t("onboardingProgressDone")
                    : step.status === "current"
                      ? t("onboardingProgressCurrent")
                    : t("onboardingProgressLocked")}
                </span>
              </div>
            </button>
          ))}
        </div>

      </aside>

      <main className="onboarding-main">
        <header className="topbar">
          <div>
            <p className="page-card__eyebrow">{t("onboardingTopbarEyebrow")}</p>
            <h2>{t("onboardingTopbarTitle")}</h2>
            <p className="subtle">{t("onboardingTopbarDescription")}</p>
          </div>
        </header>

        <section className="onboarding-grid">
          {selectedStepIndex === 0 ? (
            <section
              className={`panel wallet-panel panel-step ${progressSteps[0]?.status} panel-step--selected`}
            >
            <div className="row-between align-start section-gap">
              <div>
                <p className="panel-label">
                  {t("onboardingCardWalletEyebrow")}
                </p>
                <h3>{t("onboardingCardWalletTitle")}</h3>
                <p className="panel-copy">
                  {t("onboardingCardWalletDescription")}
                </p>
              </div>
              <span className={`badge badge--${walletBadgeTone}`}>
                {walletStatusLabel}
              </span>
            </div>

            <div
              className={`wallet-card ${walletConnected ? "wallet-card--connected" : ""}`}
            >
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
              {isWalletStepDone ? (
                <button
                  className="btn secondary small"
                  onClick={() => void handleEditWalletStep()}
                  type="button"
                >
                  {t("onboardingEditAction")}
                </button>
              ) : (
                <button
                  className="btn secondary"
                  onClick={() =>
                    void (walletConnected ? disconnectWallet() : connectWallet())
                  }
                  type="button"
                >
                  {walletConnected
                    ? t("onboardingWalletActionDisconnect")
                    : t("onboardingWalletAction")}
                </button>
              )}
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

            {isWalletStepDone ? (
              <div className="done-note">
                <strong>{t("onboardingStepCompletedTitle")}</strong>
                <p>{t("onboardingWalletDoneNote")}</p>
              </div>
            ) : null}
            </section>
          ) : null}

          {revealAdditionalSteps && selectedStepIndex === 1 ? (
            <section
              className={`panel builder-panel panel-step ${progressSteps[1]?.status} panel-step--selected`}
            >
            <div className="row-between align-start section-gap">
              <div>
                <p className="panel-label">{t("onboardingCardBuilderEyebrow")}</p>
                <h3>{t("onboardingBuilderApprovalTitle")}</h3>
                <p className="panel-copy">
                  {t("onboardingBuilderApprovalDescription")}
                </p>
              </div>
              <span className={`badge badge--${builderBadgeTone}`}>
                {builderStatusLabel}
              </span>
            </div>

            {isBuilderStepDone ? (
              <div className="panel-step__header">
                <div className="done-note panel-step__summary">
                  <strong>{t("onboardingStepCompletedTitle")}</strong>
                  <p>{builderApprovalMessage}</p>
                </div>
                <button
                  className="btn secondary small"
                  onClick={handleEditBuilderStep}
                  type="button"
                >
                  {t("onboardingEditAction")}
                </button>
              </div>
            ) : null}

            {!walletConnected ? (
              <div className="info-note">
                <div className="row-between align-start section-gap">
                  <div>
                    <strong>{t("onboardingLockedStepTitle")}</strong>
                    <p>{t("onboardingBuilderLockedNote")}</p>
                  </div>
                </div>
                <small>{builderApprovalMessage}</small>
              </div>
            ) : null}

            <div className="action-row">
              <button
                className="btn secondary"
                disabled={
                  !isBuilderStepCurrent ||
                  !walletConnected ||
                  !canSignMessages ||
                  state.builderApproval.approvalStatus === "approving"
                }
                onClick={() => void handleApproveBuilderCode()}
                type="button"
              >
                {t("onboardingBuilderApprovalAction")}
              </button>
            </div>

            {isBuilderStepDone ? (
              <div className="info-note">
                <p>{builderApprovalMessage}</p>
                <small>{t("onboardingBuilderDoneNote")}</small>
              </div>
            ) : null}
            </section>
          ) : null}

          {revealAdditionalSteps && selectedStepIndex === 2 ? (
            <section
              className={`panel keys-panel panel-step ${progressSteps[2]?.status} panel-step--selected`}
            >
            <div className="row-between align-start section-gap">
              <div>
                <p className="panel-label">
                  {t("onboardingCardCredentialsEyebrow")}
                </p>
                <h3>{t("onboardingCardCredentialsTitle")}</h3>
                <p className="panel-copy">
                  {t("onboardingCardCredentialsDescription")}
                </p>
              </div>
              <span className={`badge badge--${credentialBadgeTone}`}>
                {credentialStatusLabel}
              </span>
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
                  disabled={isCredentialStepDone || isCredentialStepLocked}
                  onChange={(event) =>
                    updateCredentialField(
                      "agentWalletPublicKey",
                      event.target.value,
                    )
                  }
                  placeholder={t("onboardingValueAwaitingPublicKey")}
                  value={state.credentials.agentWalletPublicKey ?? ""}
                />
                {fieldErrors.agentWalletPublicKey ? (
                  <em className="onboarding-form__error">
                    {t("onboardingFieldErrorPrefix")}:{" "}
                    {fieldErrors.agentWalletPublicKey}
                  </em>
                ) : (
                  <small>{t("onboardingHelperAgentWalletPublic")}</small>
                )}
              </label>

              <label className="onboarding-form__field">
                <span>{t("onboardingAgentWalletPrivateLabel")}</span>
                <textarea
                  className="onboarding-form__input onboarding-form__input--multiline"
                  disabled={isCredentialStepDone || isCredentialStepLocked}
                  onChange={(event) =>
                    updateCredentialField(
                      "agentWalletPrivateKey",
                      event.target.value,
                    )
                  }
                  placeholder={t("onboardingValueAwaitingPrivateKey")}
                  value={state.credentials.agentWalletPrivateKey ?? ""}
                />
                {fieldErrors.agentWalletPrivateKey ? (
                  <em className="onboarding-form__error">
                    {t("onboardingFieldErrorPrefix")}:{" "}
                    {fieldErrors.agentWalletPrivateKey}
                  </em>
                ) : (
                  <small>{t("onboardingHelperAgentWalletPrivate")}</small>
                )}
              </label>

              <label className="onboarding-form__field">
                <span>{t("onboardingCredentialAliasLabel")}</span>
                <input
                  className="onboarding-form__input"
                  disabled={isCredentialStepDone || isCredentialStepLocked}
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
                  walletConnected
                    ? "status-row--success"
                    : "status-row--neutral"
                }`}
              >
                <span
                  className={`status-dot ${
                    walletConnected
                      ? "status-dot--success"
                      : "status-dot--neutral"
                  }`}
                ></span>
                <div>
                  <strong>{walletStatusLabel}</strong>
                  <p>{walletMicrocopy}</p>
                </div>
              </div>

              <div
                className={`status-row ${
                  state.builderApproval.approvalStatus === "approved"
                    ? "status-row--success"
                    : state.builderApproval.approvalStatus === "approving"
                      ? "status-row--info"
                      : state.builderApproval.approvalStatus === "rejected" ||
                          state.builderApproval.approvalStatus === "error"
                        ? "status-row--danger"
                        : "status-row--neutral"
                }`}
              >
                <span
                  className={`status-dot ${
                    state.builderApproval.approvalStatus === "approved"
                      ? "status-dot--success"
                      : state.builderApproval.approvalStatus === "approving"
                        ? "status-dot--info"
                        : state.builderApproval.approvalStatus === "rejected" ||
                            state.builderApproval.approvalStatus === "error"
                          ? "status-dot--danger"
                          : "status-dot--neutral"
                  }`}
                ></span>
                <div>
                  <strong>{builderStatusLabel}</strong>
                  <p>{builderMicrocopy}</p>
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

            <div className="info-note">
              <strong>{t("onboardingValidationMessageLabel")}</strong>
              <p>{credentialBanner}</p>
              <small>{validationMessage}</small>
            </div>

            {isCredentialStepDone ? (
              <div className="done-note done-note--action">
                <div>
                  <strong>{t("onboardingStepCompletedTitle")}</strong>
                  <p>{validationMessage}</p>
                </div>
                <button
                  className="btn secondary small"
                  onClick={handleEditCredentialStep}
                  type="button"
                >
                  {t("onboardingEditAction")}
                </button>
              </div>
            ) : null}

            <div className="action-row">
              <button
                className="btn secondary"
                disabled={isCredentialStepDone || !isCredentialStepCurrent}
                onClick={clearCredentialForm}
                type="button"
              >
                {t("onboardingClearAction")}
              </button>
              <button
                className="btn primary"
                disabled={
                  !isCredentialStepCurrent ||
                  !walletConnected ||
                  !builderApproved ||
                  isCredentialStepDone ||
                  state.credentials.validationStatus === "validating"
                }
                onClick={() => void handleValidateCredentials()}
                type="button"
              >
                {t("onboardingCredentialAction")}
              </button>
            </div>
            </section>
          ) : null}

          {revealAdditionalSteps && selectedStepIndex === 3 ? (
            <section
              className={`panel account-panel panel-step ${progressSteps[3]?.status} panel-step--selected`}
            >
            <div className="row-between align-start section-gap">
              <div>
                <p className="panel-label">
                  {t("onboardingCardOperationalEyebrow")}
                </p>
                <h3>{t("onboardingCardOperationalTitle")}</h3>
                <p className="panel-copy">
                  {t("onboardingCardOperationalDescription")}
                </p>
              </div>
              <span
                className={`badge badge--${
                  isOperationalStepLocked ? "neutral" : operationalBadgeTone
                }`}
              >
                {isOperationalStepLocked
                  ? t("onboardingProgressLocked")
                  : operationalStatusLabel}
              </span>
            </div>

            <div className="info-note">
              <strong>{t("onboardingOperationalDisclosureTitle")}</strong>
              <p>
                {isOperationalStepLocked
                  ? t("onboardingOperationalLockedNote")
                  : t("onboardingOperationalDisclosureDescription")}
              </p>
              <small>{t("onboardingOperationalDisclosureNote")}</small>
            </div>

            {isOperationalStepDone ? (
              <div className="done-note done-note--action">
                <div>
                  <strong>{t("onboardingStepCompletedTitle")}</strong>
                  <p>{operationalMessage}</p>
                </div>
                <button
                  className="btn secondary small"
                  onClick={handleEditOperationalStep}
                  type="button"
                >
                  {t("onboardingEditAction")}
                </button>
              </div>
            ) : null}

            <div className="action-row">
              <button
                className="btn secondary"
                disabled={
                  !isOperationalStepCurrent ||
                  state.credentials.validationStatus !== "valid" ||
                  !state.credentials.credentialId ||
                  state.operational.status === "verifying" ||
                  state.operational.status === "verified"
                }
                onClick={() => void handleRunOperationalCheck()}
                type="button"
              >
                {t("onboardingOperationalAction")}
              </button>
            </div>
            </section>
          ) : null}
        </section>

      </main>
    </div>
  );
}
