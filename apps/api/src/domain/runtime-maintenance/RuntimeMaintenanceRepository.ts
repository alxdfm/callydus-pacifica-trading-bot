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

export type PacificaExternalAccountSnapshot = {
  fetchedAtIso: string;
  balance: {
    totalBalance: number;
    availableBalance: number;
    aggregatedPnl: number;
    capitalInUse: number;
    capturedAtIso: string;
  } | null;
  positions: Array<{
    symbol: string;
    side: "long" | "short";
    quantity: number;
    entryPrice: number;
    currentPrice: number;
    unrealizedPnl: number;
    pacificaTradeId: string;
    isPlatformTrade: boolean;
  }>;
  recentTradeHistory: Array<{
    symbol: string;
    side: "open_long" | "open_short" | "close_long" | "close_short";
    clientOrderId: string | null;
    orderId: string | null;
    price: number;
    entryPrice: number | null;
    amount: number;
    pnl: number;
    createdAtIso: string;
    cause: string | null;
  }>;
  orderHistorySummary: {
    openOrderCount: number;
    stopOrderCount: number;
    lastOrderId: string | null;
  };
};

export type ApplyPacificaExternalSnapshotInput = {
  walletAddress: string;
  snapshot: PacificaExternalAccountSnapshot;
  nowIso: string;
};

export type MarkPacificaSnapshotUnavailableInput = {
  walletAddress: string;
  nowIso: string;
  message: string;
};

export interface RuntimeMaintenanceRepository {
  heartbeatRuntime(input: RuntimeHeartbeatInput): Promise<BotRuntimeState | null>;
  reconcileRuntime(input: RuntimeReconcileInput): Promise<RuntimeReconcileResult | null>;
  applyPacificaExternalSnapshot(
    input: ApplyPacificaExternalSnapshotInput,
  ): Promise<void>;
  markPacificaSnapshotUnavailable(
    input: MarkPacificaSnapshotUnavailableInput,
  ): Promise<void>;
}
