import type {
  BalanceSnapshot,
  BotStatus,
  ClosedTrade,
  OperationalAlert,
  OpenTrade,
  SyncStatus,
} from "@pacifica/contracts";

export type RuntimeState = {
  balance: BalanceSnapshot | null;
  botStatus: BotStatus;
  syncStatus: SyncStatus;
  currentTrades: OpenTrade[];
  closedTrades: ClosedTrade[];
  alerts: OperationalAlert[];
  screenStatus: "idle" | "loading" | "ready" | "error";
  lastRuntimeMessage: string | null;
};

export function createEmptyRuntimeState(): RuntimeState {
  return {
    balance: null,
    botStatus: "inactive",
    syncStatus: "idle",
    currentTrades: [],
    closedTrades: [],
    alerts: [],
    screenStatus: "idle",
    lastRuntimeMessage: null,
  };
}
