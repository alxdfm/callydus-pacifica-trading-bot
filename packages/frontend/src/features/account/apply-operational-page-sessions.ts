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
import {
  createRuntimePersistentFeedback,
  type RuntimeState,
} from "../runtime/runtime-state";

type ApplyOperationalPageSessionDependencies = {
  setBuilderApprovalState: (value: Partial<BuilderApprovalState>) => void;
  setCredentialState: (value: Partial<CredentialState>) => void;
  setOperationalState: (value: Partial<OperationalVerificationState>) => void;
  setPresetState: (value: Partial<AppSessionState["presets"]>) => void;
  setRuntimeState: (value: Partial<RuntimeState>) => void;
  currentPresets?: AppSessionState["presets"];
};

export function applyOperationalProfileSessionSnapshot(
  snapshot: OperationalProfileSessionFound,
  dependencies: ApplyOperationalPageSessionDependencies,
) {
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
    ...createRuntimePersistentFeedback(snapshot.runtime.lastErrorMessage),
  });
}

export function applyOperationalDashboardSessionSnapshot(
  snapshot: OperationalDashboardSessionFound,
  dependencies: ApplyOperationalPageSessionDependencies,
) {
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
    ...createRuntimePersistentFeedback(snapshot.runtime.lastErrorMessage),
  });
  dependencies.setPresetState({
    yourStrategy: snapshot.yourStrategy,
  });
}

export function applyOperationalPresetsSessionSnapshot(
  snapshot: OperationalPresetsSessionFound,
  dependencies: ApplyOperationalPageSessionDependencies,
) {
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
  dependencies.setRuntimeState({
    botStatus: snapshot.runtime.botStatus,
    syncStatus: snapshot.runtime.syncStatus,
    exchangeSnapshotStatus: snapshot.runtime.exchangeSnapshotStatus,
    exchangeLastSyncedAt: snapshot.runtime.exchangeLastSyncedAt,
    exchangeSnapshotMessage: snapshot.runtime.exchangeSnapshotMessage,
    currentTrades: snapshot.runtime.currentTrades,
    ...createRuntimePersistentFeedback(snapshot.runtime.lastErrorMessage),
  });
}

export function applyOperationalHistorySessionSnapshot(
  snapshot: OperationalHistorySessionFound,
  dependencies: ApplyOperationalPageSessionDependencies,
) {
  dependencies.setRuntimeState({
    botStatus: snapshot.runtime.botStatus,
    syncStatus: snapshot.runtime.syncStatus,
    exchangeSnapshotStatus: snapshot.runtime.exchangeSnapshotStatus,
    exchangeLastSyncedAt: snapshot.runtime.exchangeLastSyncedAt,
    exchangeSnapshotMessage: snapshot.runtime.exchangeSnapshotMessage,
    closedTrades: snapshot.runtime.closedTrades,
    ...createRuntimePersistentFeedback(snapshot.runtime.lastErrorMessage),
  });
}
