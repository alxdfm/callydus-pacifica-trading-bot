import type {
  OperationalSessionSnapshotFound,
} from "@pacifica/contracts";

type ApplyAccountSessionDependencies = {
  setBuilderApprovalState: (value: Record<string, unknown>) => void;
  setCredentialState: (value: Record<string, unknown>) => void;
  setOperationalState: (value: Record<string, unknown>) => void;
  setPresetState: (value: Record<string, unknown>) => void;
  setRuntimeState: (value: Record<string, unknown>) => void;
  setOnboardingState?: (value: Record<string, unknown>) => void;
};

export function applyAccountSessionSnapshot(
  snapshot: OperationalSessionSnapshotFound,
  dependencies: ApplyAccountSessionDependencies,
) {
  dependencies.setBuilderApprovalState({
    approvalStatus: snapshot.builderApproved ? "approved" : "pending",
    lastErrorCode: null,
    lastMessage: "Operational session loaded from backend.",
    retryable: false,
  });
  dependencies.setCredentialState({
    credentialId: snapshot.credentialId,
    agentWalletPublicKey: snapshot.agentWalletPublicKey,
    agentWalletPrivateKey: null,
    credentialAlias: snapshot.credentialAlias,
    keyFingerprint: snapshot.keyFingerprint,
    validationStatus: snapshot.credentialId ? "valid" : "pending",
    lastValidatedAt: null,
    lastErrorCode: null,
    lastValidationMessage: "Operational session loaded from backend.",
    retryable: false,
  });
  dependencies.setOperationalState({
    status: snapshot.operationallyVerified ? "verified" : "pending",
    lastVerifiedAt: snapshot.runtime.lastHeartbeatAt,
    lastErrorCode: null,
    lastMessage: snapshot.runtime.lastErrorMessage,
    retryable: false,
    probeSymbol: null,
    probeClientOrderId: null,
  });
  dependencies.setPresetState({
    activePreset: snapshot.activePreset,
    selectedPresetDefinitionId: snapshot.activePreset?.presetDefinitionId ?? null,
    draftEditableConfig: snapshot.activePreset?.editableConfig ?? null,
    activationStatus: "idle",
    activationMessage: null,
  });
  dependencies.setRuntimeState({
    balance: snapshot.runtime.balance,
    botStatus: snapshot.runtime.botStatus,
    syncStatus: snapshot.runtime.syncStatus,
    currentTrades: snapshot.runtime.currentTrades,
    closedTrades: snapshot.runtime.closedTrades,
    alerts: snapshot.runtime.activeAlerts,
    screenStatus: snapshot.runtime.lastErrorMessage ? "error" : "ready",
    lastRuntimeMessage: snapshot.runtime.lastErrorMessage,
  });

  dependencies.setOnboardingState?.({
    status: snapshot.onboardingStatus,
    accountReady: snapshot.canAccessProduct,
    accountLookupStatus: "existing_account",
    discoveredWalletAddress: snapshot.walletAddress,
    showCompletionModal: false,
  });
}
