import type {
  BalanceSnapshot,
  BotStatus,
  ClosedTrade,
  ExchangeSnapshotStatus,
  OperationalEvent,
  OperationalAlert,
  OpenTrade,
  SyncStatus,
} from "@pacifica/contracts";

export type RuntimeState = {
  balance: BalanceSnapshot | null;
  botStatus: BotStatus;
  syncStatus: SyncStatus;
  exchangeSnapshotStatus: ExchangeSnapshotStatus;
  exchangeLastSyncedAt: string | null;
  exchangeSnapshotMessage: string | null;
  currentTrades: OpenTrade[];
  closedTrades: ClosedTrade[];
  alerts: OperationalAlert[];
  events: OperationalEvent[];
  screenStatus: "idle" | "loading" | "ready" | "error";
  lastRuntimeMessage: string | null;
};

export function createEmptyRuntimeState(): RuntimeState {
  return {
    balance: null,
    botStatus: "inactive",
    syncStatus: "idle",
    exchangeSnapshotStatus: "last_known",
    exchangeLastSyncedAt: null,
    exchangeSnapshotMessage: null,
    currentTrades: [],
    closedTrades: [],
    alerts: [],
    events: [],
    screenStatus: "idle",
    lastRuntimeMessage: null,
  };
}
