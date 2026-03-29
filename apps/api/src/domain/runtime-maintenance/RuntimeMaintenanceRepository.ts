import type { BotRuntimeState } from "@pacifica/contracts";

export type RuntimeHeartbeatInput = {
  walletAddress: string;
  botStatus: BotRuntimeState["botStatus"];
  syncStatus: BotRuntimeState["syncStatus"];
  pacificaConnectionStatus: BotRuntimeState["pacificaConnectionStatus"];
  lastErrorMessage: string | null;
  nowIso: string;
};

export type RuntimeReconcileInput = {
  walletAddress: string;
  nowIso: string;
  degradedAfterMs: number;
  errorAfterMs: number;
};

export type RuntimeReconcileResult = {
  runtime: BotRuntimeState;
  recoveredRuntimeState: boolean;
  detectedDivergence: boolean;
  alertMessage: string | null;
};

export interface RuntimeMaintenanceRepository {
  heartbeatRuntime(input: RuntimeHeartbeatInput): Promise<BotRuntimeState | null>;
  reconcileRuntime(input: RuntimeReconcileInput): Promise<RuntimeReconcileResult | null>;
}
