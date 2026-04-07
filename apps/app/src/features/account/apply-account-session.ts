import type {
  OperationalSessionSnapshotFound,
} from "@pacifica/contracts";
import type {
  AppSessionState,
  BuilderApprovalState,
  CredentialState,
  OperationalVerificationState,
} from "../../state/app-state";
import type { RuntimeState } from "../runtime/runtime-state";

type ApplyAccountSessionDependencies = {
  setBuilderApprovalState: (value: Partial<BuilderApprovalState>) => void;
  setCredentialState: (value: Partial<CredentialState>) => void;
  setOperationalState: (value: Partial<OperationalVerificationState>) => void;
  setPresetState: (value: Partial<AppSessionState["presets"]>) => void;
  setRuntimeState: (value: Partial<RuntimeState>) => void;
  setOnboardingState?: (value: Partial<AppSessionState["onboarding"]>) => void;
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
    exchangeSnapshotStatus: snapshot.runtime.exchangeSnapshotStatus,
    exchangeLastSyncedAt: snapshot.runtime.exchangeLastSyncedAt,
    exchangeSnapshotMessage: snapshot.runtime.exchangeSnapshotMessage,
    symbolOperationalConfigs: snapshot.runtime.symbolOperationalConfigs,
    currentTrades: snapshot.runtime.currentTrades,
    closedTrades: snapshot.runtime.closedTrades,
    alerts: snapshot.runtime.activeAlerts,
    events: snapshot.recentEvents,
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
