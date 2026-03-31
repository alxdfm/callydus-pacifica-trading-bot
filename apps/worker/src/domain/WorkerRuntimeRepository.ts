import type {
  AlertSeverity,
  BotStatus,
  PacificaConnectionStatus,
  PresetEditableConfig,
  PresetTechnicalContract,
  SyncStatus,
  TradeSide,
} from "@pacifica/contracts";

export type WorkerRuntimeCandidate = {
  operatorAccountId: string;
  walletAddress: string;
  activePresetActivationId: string;
};

export type AcquiredWorkerLease = {
  operatorAccountId: string;
  walletAddress: string;
  activePresetActivationId: string;
};

export type OwnedRuntimeSnapshot = {
  operatorAccountId: string;
  walletAddress: string;
  activePresetActivationId: string | null;
  botStatus: BotStatus;
  lastSignalEvaluationAt: string | null;
  activePreset:
    | {
        id: string;
        presetDefinitionId: string;
        symbol: string;
        editableConfig: PresetEditableConfig;
        effectiveContract: PresetTechnicalContract;
      }
    | null;
};

export type AcquireWorkerLeaseInput = {
  operatorAccountId: string;
  workerId: string;
  nowIso: string;
  leaseExpiresAtIso: string;
};

export type HeartbeatOwnedRuntimeInput = {
  operatorAccountId: string;
  workerId: string;
  nowIso: string;
  leaseExpiresAtIso: string;
  botStatus: BotStatus;
  syncStatus: SyncStatus;
  pacificaConnectionStatus: PacificaConnectionStatus;
  lastErrorMessage: string | null;
  lastSignalEvaluationAtIso?: string;
  lastSignalFingerprint?: string | null;
};

export type StopOwnedRuntimeInput = {
  operatorAccountId: string;
  workerId: string;
  nowIso: string;
  botStatus: BotStatus;
  syncStatus: SyncStatus;
  pacificaConnectionStatus: PacificaConnectionStatus;
  lastErrorMessage: string | null;
};

export type ReleaseWorkerLeaseInput = {
  operatorAccountId: string;
  workerId: string;
};

export type CreateSignalDecisionInput = {
  operatorAccountId: string;
  presetActivationId: string;
  signalFingerprint: string;
  signalSide: TradeSide;
  symbol: string;
  marketSymbol: string;
  timeframe: string;
  priceSource: string;
  candleOpenTimeIso: string;
  candleCloseTimeIso: string;
  entryReferencePrice: number;
  stopLossPrice: number;
  takeProfitPrice: number;
  riskDistance: number;
  payloadJson: unknown;
  requestedAtIso: string;
};

export type SignalDecisionWriteResult =
  | {
      status: "created";
      decisionId: string;
    }
  | {
      status: "duplicate";
      decisionId: string;
    };

export type AppendWorkerOperationalEventInput = {
  operatorAccountId: string;
  eventType: "signal_evaluation" | "order_execution";
  severity: AlertSeverity;
  title: string;
  message: string;
  payloadJson?: unknown;
};

export type ExecutableSignalDecision = {
  signalDecisionId: string;
  operatorAccountId: string;
  walletAddress: string;
  presetActivationId: string;
  signalFingerprint: string;
  signalSide: TradeSide;
  symbol: string;
  marketSymbol: string;
  entryReferencePrice: number;
  stopLossPrice: number;
  takeProfitPrice: number;
  riskDistance: number;
  requestedAt: string;
  credential: {
    publicKey: string;
    encryptedPrivateKeyRef: string;
  };
  activation: {
    positionSizeType: "fixed_amount" | "balance_percent";
    positionSizeValue: number;
    symbol: string;
    effectiveContract: PresetTechnicalContract;
  };
  latestBalanceSnapshot: {
    availableBalance: number;
    totalBalance: number;
    capitalInUse: number;
    capturedAt: string;
  } | null;
};

export type ClaimSignalDecisionInput = {
  signalDecisionId: string;
};

export type RecordOrderExecutionAttemptInput = {
  operatorAccountId: string;
  presetActivationId: string;
  signalDecisionId: string;
  clientOrderId: string;
  signalFingerprint: string;
  symbol: string;
  marketSymbol: string;
  orderSide: TradeSide;
  requestedNotionalUsd: number;
  requestedQuantity: number;
  entryReferencePrice: number;
  slippagePercent: number;
  requestJson: unknown;
  responseJson: unknown;
  executionStatus: "sent" | "failed";
  failureReason: string | null;
  retryableFailure: boolean;
  pacificaOrderId: string | null;
  requestedAtIso: string;
  finishedAtIso: string | null;
};

export type FailSignalDecisionInput = {
  signalDecisionId: string;
};

export type CompleteSignalDecisionInput = {
  signalDecisionId: string;
};

export type PauseRuntimeAfterExecutionFailureInput = {
  operatorAccountId: string;
  workerId: string;
  nowIso: string;
  message: string;
};

/**
 * Repository used by the worker to discover runnable accounts, claim
 * single-account ownership and keep the persisted runtime alive.
 */
export interface WorkerRuntimeRepository {
  listRunnableRuntimeCandidates(nowIso: string): Promise<WorkerRuntimeCandidate[]>;
  tryAcquireWorkerLease(input: AcquireWorkerLeaseInput): Promise<AcquiredWorkerLease | null>;
  readOwnedRuntimeSnapshot(
    operatorAccountId: string,
    workerId: string,
  ): Promise<OwnedRuntimeSnapshot | null>;
  heartbeatOwnedRuntime(input: HeartbeatOwnedRuntimeInput): Promise<boolean>;
  stopOwnedRuntime(input: StopOwnedRuntimeInput): Promise<void>;
  releaseWorkerLease(input: ReleaseWorkerLeaseInput): Promise<void>;
  createSignalDecision(
    input: CreateSignalDecisionInput,
  ): Promise<SignalDecisionWriteResult>;
  appendOperationalEvent(input: AppendWorkerOperationalEventInput): Promise<void>;
  claimNextExecutableSignalDecision(
    operatorAccountId: string,
  ): Promise<ExecutableSignalDecision | null>;
  recordOrderExecutionAttempt(
    input: RecordOrderExecutionAttemptInput,
  ): Promise<void>;
  failSignalDecision(input: FailSignalDecisionInput): Promise<void>;
  completeSignalDecision(input: CompleteSignalDecisionInput): Promise<void>;
  pauseRuntimeAfterExecutionFailure(
    input: PauseRuntimeAfterExecutionFailureInput,
  ): Promise<void>;
}
