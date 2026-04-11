import type {
  OperationalDashboardSessionFound,
  OperationalHistorySessionFound,
  OperationalPresetsSessionFound,
  OperationalProfileSessionFound,
  OperationalTradesSessionFound,
} from "@pacifica/contracts";
import type {
  AppSessionState,
  BuilderApprovalState,
  CredentialState,
  OperationalVerificationState,
} from "../../state/app-state";
import type { RuntimeState } from "../runtime/runtime-state";

type ApplyOperationalPageSessionDependencies = {
  setBuilderApprovalState: (value: Partial<BuilderApprovalState>) => void;
  setCredentialState: (value: Partial<CredentialState>) => void;
  setOperationalState: (value: Partial<OperationalVerificationState>) => void;
  setPresetState: (value: Partial<AppSessionState["presets"]>) => void;
  setRuntimeState: (value: Partial<RuntimeState>) => void;
  setOnboardingState?: (value: Partial<AppSessionState["onboarding"]>) => void;
  currentPresets?: AppSessionState["presets"];
};

function applyOperationalShell(
  snapshot: {
    walletAddress: string;
    onboardingStatus: AppSessionState["onboarding"]["status"];
    activePreset: AppSessionState["presets"]["activePreset"];
    canAccessProduct: boolean;
  },
  dependencies: ApplyOperationalPageSessionDependencies,
) {
  dependencies.setPresetState({
    activePreset: snapshot.activePreset,
  });

  dependencies.setOnboardingState?.({
    status: snapshot.onboardingStatus,
    accountReady: snapshot.canAccessProduct,
    accountLookupStatus: "existing_account",
    discoveredWalletAddress: snapshot.walletAddress,
    showCompletionModal: false,
  });
}

export function applyOperationalProfileSessionSnapshot(
  snapshot: OperationalProfileSessionFound,
  dependencies: ApplyOperationalPageSessionDependencies,
) {
  applyOperationalShell(snapshot, dependencies);

  dependencies.setBuilderApprovalState({
    approvalStatus: snapshot.builderApproved ? "approved" : "pending",
    lastErrorCode: null,
    lastMessage: "Operational profile loaded from backend.",
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
    lastValidationMessage: "Operational profile loaded from backend.",
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
  dependencies.setRuntimeState({
    botStatus: snapshot.runtime.botStatus,
    screenStatus: snapshot.runtime.lastErrorMessage ? "error" : "ready",
    lastRuntimeMessage: snapshot.runtime.lastErrorMessage,
  });
}

export function applyOperationalDashboardSessionSnapshot(
  snapshot: OperationalDashboardSessionFound,
  dependencies: ApplyOperationalPageSessionDependencies,
) {
  applyOperationalShell(snapshot, dependencies);

  dependencies.setRuntimeState({
    balance: snapshot.runtime.balance,
    botStatus: snapshot.runtime.botStatus,
    syncStatus: snapshot.runtime.syncStatus,
    exchangeSnapshotStatus: snapshot.runtime.exchangeSnapshotStatus,
    exchangeLastSyncedAt: snapshot.runtime.exchangeLastSyncedAt,
    exchangeSnapshotMessage: snapshot.runtime.exchangeSnapshotMessage,
    currentTrades: snapshot.runtime.currentTrades,
    closedTrades: snapshot.runtime.closedTrades,
    alerts: snapshot.runtime.activeAlerts,
    events: snapshot.recentEvents,
    screenStatus: snapshot.runtime.lastErrorMessage ? "error" : "ready",
    lastRuntimeMessage: snapshot.runtime.lastErrorMessage,
  });
}

export function applyOperationalPresetsSessionSnapshot(
  snapshot: OperationalPresetsSessionFound,
  dependencies: ApplyOperationalPageSessionDependencies,
) {
  applyOperationalShell(snapshot, dependencies);

  const shouldHydratePresetSelection =
    dependencies.currentPresets?.selectedPresetDefinitionId == null &&
    dependencies.currentPresets?.draftEditableConfig == null;

  dependencies.setPresetState({
    activePreset: snapshot.activePreset,
    ...(shouldHydratePresetSelection
      ? {
          selectedPresetDefinitionId:
            snapshot.activePreset?.presetDefinitionId ?? null,
          draftEditableConfig: snapshot.activePreset?.editableConfig ?? null,
        }
      : {}),
  });
  dependencies.setRuntimeState({
    balance: snapshot.runtime.balance,
    botStatus: snapshot.runtime.botStatus,
    symbolOperationalConfigs: snapshot.runtime.symbolOperationalConfigs,
  });
}

export function applyOperationalTradesSessionSnapshot(
  snapshot: OperationalTradesSessionFound,
  dependencies: ApplyOperationalPageSessionDependencies,
) {
  applyOperationalShell(snapshot, dependencies);

  dependencies.setRuntimeState({
    botStatus: snapshot.runtime.botStatus,
    syncStatus: snapshot.runtime.syncStatus,
    exchangeSnapshotStatus: snapshot.runtime.exchangeSnapshotStatus,
    exchangeLastSyncedAt: snapshot.runtime.exchangeLastSyncedAt,
    exchangeSnapshotMessage: snapshot.runtime.exchangeSnapshotMessage,
    currentTrades: snapshot.runtime.currentTrades,
    screenStatus: snapshot.runtime.lastErrorMessage ? "error" : "ready",
    lastRuntimeMessage: snapshot.runtime.lastErrorMessage,
  });
}

export function applyOperationalHistorySessionSnapshot(
  snapshot: OperationalHistorySessionFound,
  dependencies: ApplyOperationalPageSessionDependencies,
) {
  applyOperationalShell(snapshot, dependencies);

  dependencies.setRuntimeState({
    botStatus: snapshot.runtime.botStatus,
    syncStatus: snapshot.runtime.syncStatus,
    exchangeSnapshotStatus: snapshot.runtime.exchangeSnapshotStatus,
    exchangeLastSyncedAt: snapshot.runtime.exchangeLastSyncedAt,
    exchangeSnapshotMessage: snapshot.runtime.exchangeSnapshotMessage,
    closedTrades: snapshot.runtime.closedTrades,
    screenStatus: snapshot.runtime.lastErrorMessage ? "error" : "ready",
    lastRuntimeMessage: snapshot.runtime.lastErrorMessage,
  });
}
