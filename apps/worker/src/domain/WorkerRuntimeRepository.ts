import type { BotStatus, PacificaConnectionStatus, SyncStatus } from "@pacifica/contracts";

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
}
