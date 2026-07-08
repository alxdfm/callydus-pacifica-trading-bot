import { Hono } from "hono";
import type { AppDeps } from "../app.js";
import type { HonoEnv } from "../middleware/auth.js";
import {
  getAccountByWallet,
  getCredentialByAccountId,
  type Credential,
} from "../db/queries/accounts.js";
import { getStrategiesByUserId, getActiveStrategyByUserId, type Strategy } from "../db/queries/strategies.js";
import { getTradesByUserId, type Trade } from "../db/queries/trades.js";
import { getEventsByStrategyId, getEventsByUserId, type Event } from "../db/queries/events.js";
import { mapStrategyToPresetActivation, mapStrategyToYourStrategy } from "./strategies.js";

// ---------------------------------------------------------------------------
// Trade mappers
// ---------------------------------------------------------------------------

function mapOpenTrade(trade: Trade) {
  return {
    id: trade.id,
    pacificaTradeId: trade.pacificaOrderId ?? trade.id,
    presetActivationId: trade.strategyId,
    symbol: trade.symbol,
    side: trade.side,
    entryPrice: Number(trade.entryPrice),
    stopLossPrice: trade.sl != null ? Number(trade.sl) : null,
    takeProfitPrice: trade.tp != null ? Number(trade.tp) : null,
    currentPrice: Number(trade.entryPrice),
    quantity: Number(trade.amount),
    capitalAllocated: 0,
    unrealizedPnl: 0,
    tradeStatus: trade.status === "closed" ? "open" : trade.status,
    openedAt: trade.openedAt.toISOString(),
    isPlatformTrade: true,
  };
}

function mapClosedTrade(trade: Trade) {
  return {
    id: trade.id,
    pacificaTradeId: trade.pacificaOrderId ?? trade.id,
    presetActivationId: trade.strategyId,
    symbol: trade.symbol,
    side: trade.side,
    entryPrice: Number(trade.entryPrice),
    exitPrice: trade.exitPrice != null ? Number(trade.exitPrice) : Number(trade.entryPrice),
    quantity: Number(trade.amount),
    capitalAllocated: 0,
    realizedPnl: trade.realizedPnl != null ? Number(trade.realizedPnl) : 0,
    closeReason: trade.closeReason ?? "system",
    openedAt: trade.openedAt.toISOString(),
    closedAt: trade.closedAt != null ? trade.closedAt.toISOString() : new Date().toISOString(),
    isPlatformTrade: true,
  };
}

function mapEvent(event: Event) {
  return {
    id: event.id,
    eventType: "runtime_reconciliation" as const,
    severity: "info" as const,
    title: event.type,
    message: event.type,
    payloadJson: event.payload ?? null,
    createdAt: event.createdAt.toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildAccountNotFound(walletAddress: string) {
  return {
    status: "not_found" as const,
    walletAddress,
    accountExists: false as const,
    canAccessProduct: false as const,
  };
}

function buildAccountError(walletAddress: string, code: string, message: string) {
  return {
    status: "error" as const,
    walletAddress,
    accountExists: false as const,
    code,
    message,
    retryable: false as const,
    canAccessProduct: false as const,
  };
}

function deriveStrategyBotStatus(strategy: Strategy | null): "active" | "paused" | "inactive" {
  if (strategy === null) return "inactive";
  if (strategy.status === "active") return "active";
  if (strategy.status === "paused") return "paused";
  return "inactive";
}

function deriveOnboardingStatus(credential: Credential | null): string {
  if (!credential) return "credentials_pending";
  if (!credential.operationallyVerified) return "credentials_validating";
  return "ready";
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

export function accountRoutes(deps: AppDeps): Hono<HonoEnv> {
  const app = new Hono<HonoEnv>();

  // POST /api/account/session
  app.post("/session", async (c) => {
    const walletAddress = c.get("walletAddress");

    try {
      const account = await getAccountByWallet(deps.db, walletAddress);

      if (!account) {
        return c.json(buildAccountNotFound(walletAddress));
      }

      const credential = await getCredentialByAccountId(deps.db, account.id);
      const strategy = await getActiveStrategyByUserId(deps.db, walletAddress);
      const allTrades = await getTradesByUserId(deps.db, walletAddress);

      const openTrades = allTrades
        .filter((t) => t.status !== "closed")
        .map(mapOpenTrade);

      const closedTrades = allTrades
        .filter((t) => t.status === "closed")
        .slice(0, 50)
        .map(mapClosedTrade);

      const recentEvents: ReturnType<typeof mapEvent>[] = [];
      if (strategy) {
        const events = await getEventsByStrategyId(deps.db, strategy.id, 20);
        recentEvents.push(...events.map(mapEvent));
      }

      const botStatus = deriveStrategyBotStatus(strategy);
      const onboardingStatus = deriveOnboardingStatus(credential);

      return c.json({
        status: "found",
        walletAddress,
        accountExists: true,
        onboardingStatus,
        credentialId: credential?.id ?? null,
        agentWalletPublicKey: credential?.publicKey ?? null,
        credentialAlias: credential?.credentialAlias ?? null,
        keyFingerprint: credential?.keyFingerprint ?? null,
        builderApproved: true,
        operationallyVerified: credential?.operationallyVerified ?? false,
        activePreset: strategy ? mapStrategyToPresetActivation(strategy) : null,
        runtime: {
          balance: null,
          botStatus,
          syncStatus: "synced",
          pacificaConnectionStatus: "connected",
          exchangeSnapshotStatus: "ok",
          exchangeLastSyncedAt: null,
          exchangeSnapshotMessage: null,
          activePresetActivationId: strategy?.id ?? null,
          symbolOperationalConfigs: [],
          lastHeartbeatAt: null,
          lastErrorMessage: null,
          currentTrades: openTrades,
          closedTrades,
          activeAlerts: [],
        },
        recentEvents,
        canAccessProduct: true,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error("[account/session]", message);
      return c.json(buildAccountError(walletAddress, "internal_error", "An internal error occurred."), 500);
    }
  });

  // POST /api/account/profile
  app.post("/profile", async (c) => {
    const walletAddress = c.get("walletAddress");

    try {
      const account = await getAccountByWallet(deps.db, walletAddress);

      if (!account) {
        return c.json(buildAccountNotFound(walletAddress));
      }

      const credential = await getCredentialByAccountId(deps.db, account.id);
      const strategy = await getActiveStrategyByUserId(deps.db, walletAddress);
      const botStatus = deriveStrategyBotStatus(strategy);

      return c.json({
        status: "found",
        builderApproved: true,
        operationallyVerified: credential?.operationallyVerified ?? false,
        credentialId: credential?.id ?? null,
        agentWalletPublicKey: credential?.publicKey ?? null,
        credentialAlias: credential?.credentialAlias ?? null,
        keyFingerprint: credential?.keyFingerprint ?? null,
        runtime: {
          botStatus,
          lastHeartbeatAt: null,
          lastErrorMessage: null,
        },
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error("[account/profile]", message);
      return c.json(buildAccountError(walletAddress, "internal_error", "An internal error occurred."), 500);
    }
  });

  // POST /api/account/dashboard
  app.post("/dashboard", async (c) => {
    const walletAddress = c.get("walletAddress");

    try {
      const account = await getAccountByWallet(deps.db, walletAddress);

      if (!account) {
        return c.json(buildAccountNotFound(walletAddress));
      }

      const strategy = await getActiveStrategyByUserId(deps.db, walletAddress);
      const allTrades = await getTradesByUserId(deps.db, walletAddress);

      const openTrades = allTrades
        .filter((t) => t.status !== "closed")
        .map(mapOpenTrade);

      const closedTrades = allTrades
        .filter((t) => t.status === "closed")
        .slice(0, 20)
        .map(mapClosedTrade);

      const recentEvents: ReturnType<typeof mapEvent>[] = [];
      if (strategy) {
        const events = await getEventsByStrategyId(deps.db, strategy.id, 10);
        recentEvents.push(...events.map(mapEvent));
      }

      const botStatus = deriveStrategyBotStatus(strategy);

      return c.json({
        status: "found",
        runtime: {
          balance: null,
          botStatus,
          syncStatus: "synced",
          exchangeSnapshotStatus: "ok",
          exchangeLastSyncedAt: null,
          exchangeSnapshotMessage: null,
          lastErrorMessage: null,
          currentTrades: openTrades,
          closedTrades,
          activeAlerts: [],
        },
        recentEvents,
        yourStrategy: strategy ? mapStrategyToYourStrategy(strategy) : null,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error("[account/dashboard]", message);
      return c.json(buildAccountError(walletAddress, "internal_error", "An internal error occurred."), 500);
    }
  });

  // POST /api/account/presets
  app.post("/presets", async (c) => {
    const walletAddress = c.get("walletAddress");

    try {
      const account = await getAccountByWallet(deps.db, walletAddress);

      if (!account) {
        return c.json(buildAccountNotFound(walletAddress));
      }

      const strategy = await getActiveStrategyByUserId(deps.db, walletAddress);
      const botStatus = deriveStrategyBotStatus(strategy);

      return c.json({
        status: "found",
        runtime: {
          balance: null,
          botStatus,
          symbolOperationalConfigs: [],
        },
        marketInfo: [],
        yourStrategy: strategy ? mapStrategyToYourStrategy(strategy) : null,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error("[account/presets]", message);
      return c.json(buildAccountError(walletAddress, "internal_error", "An internal error occurred."), 500);
    }
  });

  // POST /api/account/trades
  app.post("/trades", async (c) => {
    const walletAddress = c.get("walletAddress");

    try {
      const account = await getAccountByWallet(deps.db, walletAddress);

      if (!account) {
        return c.json(buildAccountNotFound(walletAddress));
      }

      const strategy = await getActiveStrategyByUserId(deps.db, walletAddress);
      const allTrades = await getTradesByUserId(deps.db, walletAddress);

      const openTrades = allTrades
        .filter((t) => t.status !== "closed")
        .map(mapOpenTrade);

      const botStatus = deriveStrategyBotStatus(strategy);

      return c.json({
        status: "found",
        runtime: {
          botStatus,
          syncStatus: "synced",
          exchangeSnapshotStatus: "ok",
          exchangeLastSyncedAt: null,
          exchangeSnapshotMessage: null,
          lastErrorMessage: null,
          currentTrades: openTrades,
        },
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error("[account/trades]", message);
      return c.json(buildAccountError(walletAddress, "internal_error", "An internal error occurred."), 500);
    }
  });

  // POST /api/account/history
  app.post("/history", async (c) => {
    const walletAddress = c.get("walletAddress");

    try {
      const account = await getAccountByWallet(deps.db, walletAddress);

      if (!account) {
        return c.json(buildAccountNotFound(walletAddress));
      }

      const strategy = await getActiveStrategyByUserId(deps.db, walletAddress);
      const allTrades = await getTradesByUserId(deps.db, walletAddress);

      const closedTrades = allTrades
        .filter((t) => t.status === "closed")
        .map(mapClosedTrade);

      const botStatus = deriveStrategyBotStatus(strategy);

      return c.json({
        status: "found",
        runtime: {
          botStatus,
          syncStatus: "synced",
          exchangeSnapshotStatus: "ok",
          exchangeLastSyncedAt: null,
          exchangeSnapshotMessage: null,
          lastErrorMessage: null,
          closedTrades,
        },
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error("[account/history]", message);
      return c.json(buildAccountError(walletAddress, "internal_error", "An internal error occurred."), 500);
    }
  });

  return app;
}
