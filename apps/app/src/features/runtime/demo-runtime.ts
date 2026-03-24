import {
  balanceSnapshotSchema,
  botStatusSchema,
  closedTradeSchema,
  operationalAlertSchema,
  openTradeSchema,
  type BotStatus,
  type ClosedTrade,
  type OperationalAlert,
  type OpenTrade,
  type PresetActivation,
  type SyncStatus,
} from "@pacifica/contracts";

export type RuntimeState = {
  balance: ReturnType<typeof balanceSnapshotSchema.parse> | null;
  botStatus: BotStatus;
  syncStatus: SyncStatus;
  currentTrades: OpenTrade[];
  closedTrades: ClosedTrade[];
  alerts: OperationalAlert[];
  screenStatus: "idle" | "loading" | "ready" | "error";
  lastRuntimeMessage: string | null;
};

const runtimeNow = () => new Date().toISOString();

function createOpenTrade(
  overrides: Partial<OpenTrade>,
  presetActivationId: string | null,
): OpenTrade {
  return openTradeSchema.parse({
    id: crypto.randomUUID(),
    pacificaTradeId: `trade_${Math.random().toString(36).slice(2, 10)}`,
    presetActivationId,
    symbol: "BTC/USDC",
    side: "long",
    entryPrice: 64280,
    currentPrice: 64990,
    quantity: 0.12,
    capitalAllocated: 1500,
    unrealizedPnl: 102,
    tradeStatus: "open",
    openedAt: runtimeNow(),
    isPlatformTrade: true,
    ...overrides,
  });
}

function createClosedTrade(overrides: Partial<ClosedTrade>): ClosedTrade {
  return closedTradeSchema.parse({
    id: crypto.randomUUID(),
    pacificaTradeId: `closed_${Math.random().toString(36).slice(2, 10)}`,
    presetActivationId: null,
    symbol: "ETH/USDC",
    side: "long",
    entryPrice: 3180,
    exitPrice: 3244,
    quantity: 0.7,
    capitalAllocated: 2200,
    realizedPnl: 74,
    closeReason: "take_profit",
    openedAt: runtimeNow(),
    closedAt: runtimeNow(),
    isPlatformTrade: true,
    ...overrides,
  });
}

function createAlert(overrides: Partial<OperationalAlert>): OperationalAlert {
  return operationalAlertSchema.parse({
    id: crypto.randomUUID(),
    alertType: "runtime",
    severity: "info",
    title: "Monitoring only",
    message: "One short trade is waiting for confirmation. No action required yet.",
    isActive: true,
    createdAt: runtimeNow(),
    resolvedAt: null,
    ...overrides,
  });
}

export function createRuntimeFromPresetActivation(
  activePreset: PresetActivation,
): RuntimeState {
  const symbol = activePreset.editableConfig.symbol;

  return {
    balance: balanceSnapshotSchema.parse({
      totalBalance: 12480.12,
      availableBalance: 9350.42,
      aggregatedPnl: 328.44,
      capitalInUse: 3129.7,
      capturedAt: runtimeNow(),
    }),
    botStatus: botStatusSchema.parse("active"),
    syncStatus: "healthy",
    currentTrades: [
      createOpenTrade(
        {
          presetActivationId: activePreset.id,
          symbol,
          side: activePreset.editableConfig.longEnabled ? "long" : "short",
          tradeStatus: "open",
          unrealizedPnl: 102,
        },
        activePreset.id,
      ),
      createOpenTrade(
        {
          presetActivationId: activePreset.id,
          symbol: "SOL/USDC",
          side: "short",
          tradeStatus: "close_requested",
          entryPrice: 182.4,
          currentPrice: 183.1,
          quantity: 6.3,
          capitalAllocated: 980,
          unrealizedPnl: -18,
        },
        activePreset.id,
      ),
      createOpenTrade(
        {
          presetActivationId: activePreset.id,
          symbol: "ETH/USDC",
          side: "long",
          tradeStatus: "open",
          entryPrice: 3180,
          currentPrice: 3206,
          quantity: 0.7,
          capitalAllocated: 2200,
          unrealizedPnl: 39,
        },
        activePreset.id,
      ),
    ],
    closedTrades: [
      createClosedTrade({
        presetActivationId: activePreset.id,
        symbol: "ETH/USDC",
        side: "long",
        realizedPnl: 74,
        closeReason: "take_profit",
      }),
      createClosedTrade({
        presetActivationId: activePreset.id,
        symbol: "ARB/USDC",
        side: "short",
        entryPrice: 1.24,
        exitPrice: 1.31,
        quantity: 900,
        capitalAllocated: 1116,
        realizedPnl: -21,
        closeReason: "manual",
      }),
      createClosedTrade({
        presetActivationId: activePreset.id,
        symbol: "BTC/USDC",
        side: "long",
        entryPrice: 64120,
        exitPrice: 63890,
        quantity: 0.1,
        capitalAllocated: 1400,
        realizedPnl: -35,
        closeReason: "stop_loss",
      }),
    ],
    alerts: [
      createAlert({}),
      createAlert({
        alertType: "reconciliation",
        severity: "warning",
        title: "Short trade waiting for confirmation",
        message: "One short position is still waiting for exchange confirmation.",
      }),
    ],
    screenStatus: "ready",
    lastRuntimeMessage: null,
  };
}

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

export function toggleBotState(runtime: RuntimeState): RuntimeState {
  const nextBotStatus: BotStatus = runtime.botStatus === "active" ? "paused" : "active";

  return {
    ...runtime,
    botStatus: nextBotStatus,
    lastRuntimeMessage:
      nextBotStatus === "paused" ? "Bot paused successfully." : "Bot resumed successfully.",
  };
}

export function closeTradeInRuntime(runtime: RuntimeState, tradeId: string): RuntimeState {
  const trade = runtime.currentTrades.find((candidate) => candidate.id === tradeId);

  if (!trade) {
    return {
      ...runtime,
      lastRuntimeMessage: "Trade could not be found.",
    };
  }

  const currentTrades = runtime.currentTrades.filter((candidate) => candidate.id !== tradeId);
  const closedTrade = closedTradeSchema.parse({
    id: crypto.randomUUID(),
    pacificaTradeId: trade.pacificaTradeId,
    presetActivationId: trade.presetActivationId,
    symbol: trade.symbol,
    side: trade.side,
    entryPrice: trade.entryPrice,
    exitPrice: trade.currentPrice,
    quantity: trade.quantity,
    capitalAllocated: trade.capitalAllocated,
    realizedPnl: trade.unrealizedPnl,
    closeReason: "manual",
    openedAt: trade.openedAt,
    closedAt: runtimeNow(),
    isPlatformTrade: trade.isPlatformTrade,
  });

  return {
    ...runtime,
    currentTrades,
    closedTrades: [closedTrade, ...runtime.closedTrades],
    lastRuntimeMessage: "Trade closed successfully.",
  };
}
