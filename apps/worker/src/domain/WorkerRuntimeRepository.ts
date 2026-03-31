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
  eventType: "signal_evaluation";
  severity: AlertSeverity;
  title: string;
  message: string;
  payloadJson?: unknown;
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
}
