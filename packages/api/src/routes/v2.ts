import { Hono } from "hono";
import type { z } from "zod";
import type { Context } from "hono";
import {
  backtestRequestSchema,
  backtestResponseSchema,
  closeTradeResponseSchema,
  eventsResponseSchema,
  marketSymbolSchema,
  marketsResponseSchema,
  saveStrategyRequestSchema,
  sessionResponseSchema,
  strategyResponseSchema,
  tradesResponseSchema,
  TRADES_DEFAULT_CLOSED_LIMIT,
} from "@pacifica/shared/contracts";
import type { AppDeps } from "../app.js";
import type { HonoEnv } from "../middleware/auth.js";
import {
  getAccountByWallet,
  getCredentialByAccountId,
} from "../db/queries/accounts.js";
import {
  getActiveStrategyByUserId,
  insertStrategy,
  updateStrategy,
  type Strategy,
} from "../db/queries/strategies.js";
import {
  getTradeByIdForUser,
  getTradesByUserId,
  updateTrade,
  type Trade,
} from "../db/queries/trades.js";
import { getEventsByStrategyId, type Event } from "../db/queries/events.js";
import {
  EquityDepletedError,
  getIntervalDurationMs,
  getRequiredPeriod,
  materializeYourStrategyTechnicalContract,
  simulatePresetBacktest,
  toPacificaMarketSymbol,
  type MarketCandleInterval,
  type YourStrategyDraft,
} from "../engine/evaluator.js";
import { fetchCandlesInChunks } from "../exchange/pacifica/candles.js";

// ---------------------------------------------------------------------------
// API v2 — contrato único em @pacifica/shared/contracts.
// Toda resposta é validada contra o schema ANTES de sair: violação de
// contrato explode aqui (500 + log) em vez de quebrar silenciosamente o
// parse do cliente.
// ---------------------------------------------------------------------------

function respondWithContract<TSchema extends z.ZodTypeAny>(
  c: Context,
  schema: TSchema,
  payload: unknown,
  httpStatus = 200,
) {
  const parsed = schema.safeParse(payload);

  if (!parsed.success) {
    console.error(
      "[v2] response contract violation",
      c.req.path,
      JSON.stringify(parsed.error.issues.slice(0, 5)),
    );
    return c.json(
      {
        status: "error",
        code: "internal_error",
        message: "Response failed contract validation.",
        retryable: false,
      },
      500,
    );
  }

  return c.json(parsed.data as Record<string, unknown>, httpStatus as 200);
}

function errorJson(
  c: Context,
  httpStatus: number,
  code: string,
  message: string,
  retryable = false,
) {
  return c.json(
    { status: "error", code, message, retryable },
    httpStatus as 400,
  );
}

// --- Mappers ----------------------------------------------------------------

function strategyToRecord(strategy: Strategy) {
  const materialized = materializeYourStrategyTechnicalContract(
    strategy.config as YourStrategyDraft,
  );

  return {
    id: strategy.id,
    status: strategy.status,
    draft: strategy.config,
    activationBlockers: materialized.activationBlockers,
    createdAt: strategy.createdAt.toISOString(),
    updatedAt: strategy.updatedAt.toISOString(),
  };
}

function tradeToContract(trade: Trade) {
  return {
    id: trade.id,
    strategyId: trade.strategyId,
    symbol: trade.symbol,
    side: trade.side,
    status: trade.status,
    amount: Number(trade.amount),
    entryPrice: Number(trade.entryPrice),
    exitPrice: trade.exitPrice !== null ? Number(trade.exitPrice) : null,
    stopLossPrice: trade.sl !== null ? Number(trade.sl) : null,
    takeProfitPrice: trade.tp !== null ? Number(trade.tp) : null,
    closeReason: trade.closeReason,
    realizedPnl: trade.realizedPnl !== null ? Number(trade.realizedPnl) : null,
    openedAt: trade.openedAt.toISOString(),
    closedAt: trade.closedAt !== null ? trade.closedAt.toISOString() : null,
  };
}

function eventToContract(event: Event) {
  return {
    id: event.id,
    type: event.type,
    payload: event.payload ?? null,
    createdAt: event.createdAt.toISOString(),
  };
}

async function fetchAvailableBalanceUsd(
  baseUrl: string,
  walletAddress: string,
): Promise<number | null> {
  try {
    const response = await fetch(
      `${baseUrl.replace(/\/+$/, "")}/api/v1/account?account=${encodeURIComponent(walletAddress)}`,
      {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(3_000),
      },
    );

    if (!response.ok) return null;

    const payload = (await response.json()) as {
      data?: { available_to_spend?: string };
    };
    const value = Number(payload.data?.available_to_spend);
    return Number.isFinite(value) ? value : null;
  } catch {
    return null;
  }
}

function roundTo(value: number, decimals = 4): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

// --- Routes -----------------------------------------------------------------

export function v2Routes(deps: AppDeps): Hono<HonoEnv> {
  const app = new Hono<HonoEnv>();

  // GET /api/v2/session — snapshot único de hidratação
  app.get("/session", async (c) => {
    const walletAddress = c.get("walletAddress");

    try {
      const account = await getAccountByWallet(deps.db, walletAddress);
      const credential = account
        ? await getCredentialByAccountId(deps.db, account.id)
        : null;
      const strategy = await getActiveStrategyByUserId(deps.db, walletAddress);
      const balanceUsd = await fetchAvailableBalanceUsd(
        deps.env.PACIFICA_REST_BASE_URL,
        walletAddress,
      );

      return respondWithContract(c, sessionResponseSchema, {
        status: "ok",
        walletAddress,
        access: credential?.operationallyVerified
          ? "ready"
          : "onboarding_required",
        credential: credential
          ? {
              id: credential.id,
              agentWalletPublicKey: credential.publicKey,
              alias: credential.credentialAlias,
              keyFingerprint: credential.keyFingerprint,
              operationallyVerified: credential.operationallyVerified,
            }
          : null,
        strategy: strategy ? strategyToRecord(strategy) : null,
        balanceUsd,
      });
    } catch (error: unknown) {
      console.error("[v2/session]", error instanceof Error ? error.message : error);
      return errorJson(c, 500, "internal_error", "Could not load the session.");
    }
  });

  // GET /api/v2/trades?limit=<closedTrades máx>
  app.get("/trades", async (c) => {
    const walletAddress = c.get("walletAddress");
    const limitRaw = Number(c.req.query("limit"));
    const closedLimit = Number.isInteger(limitRaw)
      ? Math.min(Math.max(limitRaw, 1), 200)
      : TRADES_DEFAULT_CLOSED_LIMIT;

    try {
      const allTrades = await getTradesByUserId(deps.db, walletAddress);
      const openTrades = allTrades
        .filter((t) => t.status !== "closed")
        .map(tradeToContract);
      const closedTrades = allTrades
        .filter((t) => t.status === "closed")
        .sort(
          (a, b) =>
            (b.closedAt ?? b.openedAt).getTime() -
            (a.closedAt ?? a.openedAt).getTime(),
        )
        .slice(0, closedLimit)
        .map(tradeToContract);

      return respondWithContract(c, tradesResponseSchema, {
        status: "ok",
        openTrades,
        closedTrades,
      });
    } catch (error: unknown) {
      console.error("[v2/trades]", error instanceof Error ? error.message : error);
      return errorJson(c, 500, "internal_error", "Could not load trades.");
    }
  });

  // POST /api/v2/trades/:id/close
  app.post("/trades/:id/close", async (c) => {
    const walletAddress = c.get("walletAddress");
    const tradeId = c.req.param("id");

    try {
      const trade = await getTradeByIdForUser(deps.db, tradeId, walletAddress);

      if (!trade) {
        return errorJson(c, 404, "trade_not_found", "Trade not found.");
      }

      if (trade.status !== "open") {
        return errorJson(
          c,
          400,
          "trade_not_open",
          `Trade cannot be closed from status "${trade.status}".`,
        );
      }

      await updateTrade(deps.db, tradeId, { status: "close_requested" });

      return respondWithContract(c, closeTradeResponseSchema, {
        status: "ok",
        trade: tradeToContract({ ...trade, status: "close_requested" }),
      });
    } catch (error: unknown) {
      console.error("[v2/trades/close]", error instanceof Error ? error.message : error);
      return errorJson(c, 500, "internal_error", "Could not request the close.");
    }
  });

  // GET /api/v2/markets — metadados reais (base→par mapeado aqui)
  app.get("/markets", async (c) => {
    try {
      const response = await fetch(
        `${deps.env.PACIFICA_REST_BASE_URL.replace(/\/+$/, "")}/api/v1/info`,
        { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(5_000) },
      );

      if (!response.ok) {
        return errorJson(c, 503, "provider_unavailable", "Market data provider is unavailable.", true);
      }

      const payload = (await response.json()) as { data?: unknown };
      const items = Array.isArray(payload.data) ? payload.data : [];

      const markets = marketSymbolSchema.options.flatMap((pair) => {
        const base = toPacificaMarketSymbol(pair);
        const item = items.find(
          (m) =>
            m &&
            typeof m === "object" &&
            (m as { symbol?: string }).symbol === base,
        ) as
          | {
              tick_size?: string;
              lot_size?: string;
              min_order_size?: string;
              max_leverage?: number;
            }
          | undefined;

        if (!item) return [];

        const maxLeverage = Number(item.max_leverage);

        if (
          !item.tick_size ||
          !item.lot_size ||
          !item.min_order_size ||
          !Number.isFinite(maxLeverage)
        ) {
          return [];
        }

        return [
          {
            symbol: pair,
            maxLeverage,
            tickSize: item.tick_size,
            lotSize: item.lot_size,
            minOrderSize: item.min_order_size,
          },
        ];
      });

      return respondWithContract(c, marketsResponseSchema, {
        status: "ok",
        markets,
      });
    } catch (error: unknown) {
      console.error("[v2/markets]", error instanceof Error ? error.message : error);
      return errorJson(c, 503, "provider_unavailable", "Market data provider is unavailable.", true);
    }
  });

  // GET /api/v2/events — eventos operacionais do worker
  app.get("/events", async (c) => {
    const walletAddress = c.get("walletAddress");

    try {
      const strategy = await getActiveStrategyByUserId(deps.db, walletAddress);
      const events = strategy
        ? await getEventsByStrategyId(deps.db, strategy.id, 50)
        : [];

      return respondWithContract(c, eventsResponseSchema, {
        status: "ok",
        events: events.map(eventToContract),
      });
    } catch (error: unknown) {
      console.error("[v2/events]", error instanceof Error ? error.message : error);
      return errorJson(c, 500, "internal_error", "Could not load events.");
    }
  });

  // POST /api/v2/strategy — salva o draft (upsert)
  app.post("/strategy", async (c) => {
    const walletAddress = c.get("walletAddress");

    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return errorJson(c, 400, "invalid_request", "Body must be valid JSON.");
    }

    const parsed = saveStrategyRequestSchema.safeParse(body);

    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return errorJson(
        c,
        400,
        "invalid_request",
        issue ? `${issue.path.join(".") || "draft"}: ${issue.message}` : "Invalid draft.",
      );
    }

    try {
      const draft = parsed.data.draft;
      const existing = await getActiveStrategyByUserId(deps.db, walletAddress);

      if (existing?.status === "active") {
        return errorJson(
          c,
          409,
          "strategy_running",
          "Editing is blocked while the strategy is active. Pause it first.",
        );
      }

      const strategy = existing
        ? ((await updateStrategy(deps.db, existing.id, walletAddress, {
            config: draft,
            symbol: draft.symbol,
            updatedAt: new Date(),
          })) ?? existing)
        : await insertStrategy(deps.db, walletAddress, {
            config: draft,
            symbol: draft.symbol,
          });

      return respondWithContract(c, strategyResponseSchema, {
        status: "ok",
        strategy: strategyToRecord(strategy),
      });
    } catch (error: unknown) {
      console.error("[v2/strategy]", error instanceof Error ? error.message : error);
      return errorJson(c, 500, "internal_error", "Could not save the strategy.", true);
    }
  });

  // POST /api/v2/strategy/activate
  app.post("/strategy/activate", async (c) => {
    const walletAddress = c.get("walletAddress");

    try {
      const strategy = await getActiveStrategyByUserId(deps.db, walletAddress);

      if (!strategy) {
        return errorJson(c, 404, "strategy_not_found", "Save a strategy first.");
      }

      const materialized = materializeYourStrategyTechnicalContract(
        strategy.config as YourStrategyDraft,
      );

      if (!materialized.technicalContract) {
        return errorJson(
          c,
          400,
          "strategy_not_executable",
          `Strategy cannot be activated: ${materialized.activationBlockers.join(", ")}.`,
        );
      }

      const updated =
        (await updateStrategy(deps.db, strategy.id, walletAddress, {
          status: "active",
          updatedAt: new Date(),
        })) ?? strategy;

      return respondWithContract(c, strategyResponseSchema, {
        status: "ok",
        strategy: strategyToRecord(updated),
      });
    } catch (error: unknown) {
      console.error("[v2/strategy/activate]", error instanceof Error ? error.message : error);
      return errorJson(c, 500, "internal_error", "Could not activate the strategy.", true);
    }
  });

  // POST /api/v2/strategy/pause
  app.post("/strategy/pause", async (c) => {
    const walletAddress = c.get("walletAddress");

    try {
      const strategy = await getActiveStrategyByUserId(deps.db, walletAddress);

      if (!strategy) {
        return errorJson(c, 404, "strategy_not_found", "No strategy to pause.");
      }

      const updated =
        (await updateStrategy(deps.db, strategy.id, walletAddress, {
          status: "paused",
          updatedAt: new Date(),
        })) ?? strategy;

      return respondWithContract(c, strategyResponseSchema, {
        status: "ok",
        strategy: strategyToRecord(updated),
      });
    } catch (error: unknown) {
      console.error("[v2/strategy/pause]", error instanceof Error ? error.message : error);
      return errorJson(c, 500, "internal_error", "Could not pause the strategy.", true);
    }
  });

  // POST /api/v2/strategy/backtest — roda sobre o draft SALVO
  app.post("/strategy/backtest", async (c) => {
    const walletAddress = c.get("walletAddress");

    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return errorJson(c, 400, "invalid_request", "Body must be valid JSON.");
    }

    const parsed = backtestRequestSchema.safeParse(body);

    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return errorJson(
        c,
        400,
        "invalid_request",
        issue ? `${issue.path.join(".")}: ${issue.message}` : "Invalid request.",
      );
    }

    const { startTime, endTime, initialCapitalUsd, leverage, feePercent, slippagePercent } =
      parsed.data;

    if (endTime <= startTime) {
      return errorJson(c, 400, "invalid_period", "Backtest period is invalid.");
    }

    try {
      const strategy = await getActiveStrategyByUserId(deps.db, walletAddress);

      if (!strategy) {
        return errorJson(c, 404, "strategy_not_found", "Save a strategy before running the backtest.");
      }

      const materialized = materializeYourStrategyTechnicalContract(
        strategy.config as YourStrategyDraft,
      );

      if (!materialized.technicalContract) {
        return errorJson(
          c,
          400,
          "strategy_not_executable",
          `Strategy is not executable: ${materialized.activationBlockers.join(", ")}.`,
        );
      }

      const technicalContract = materialized.technicalContract;
      const marketSymbol = toPacificaMarketSymbol(technicalContract.symbol);

      if (!marketSymbol) {
        return errorJson(c, 400, "unsupported_symbol", "Unsupported symbol.");
      }

      const intervalMs = getIntervalDurationMs(
        technicalContract.timeframe as MarketCandleInterval,
      );
      const requiredPeriod = getRequiredPeriod(technicalContract);
      const warmupStartTime =
        startTime - intervalMs * Math.max(requiredPeriod + 5, 30);

      const candles = await fetchCandlesInChunks({
        baseUrl: deps.env.PACIFICA_REST_BASE_URL,
        symbol: marketSymbol,
        timeframe: technicalContract.timeframe,
        startTime: warmupStartTime,
        endTime,
        intervalMs,
      });

      if (candles === null) {
        return errorJson(c, 503, "provider_unavailable", "Market data provider is unavailable.", true);
      }

      if (candles.length < requiredPeriod + 3) {
        return errorJson(c, 400, "insufficient_market_data", "Not enough candles for simulation.", true);
      }

      let simulation: ReturnType<typeof simulatePresetBacktest>;

      try {
        simulation = simulatePresetBacktest({
          technicalContract,
          candles,
          initialCapitalUsd,
          leverage,
          feePercent,
          slippagePercent,
        });
      } catch (error) {
        if (error instanceof EquityDepletedError) {
          return errorJson(c, 400, "equity_depleted", error.message);
        }
        const message =
          error instanceof Error && error.message.trim()
            ? error.message
            : "Not enough candles.";
        return errorJson(c, 400, "insufficient_market_data", message, true);
      }

      const equityCurve = simulation.equityCurve.filter(
        (p) => new Date(p.time).getTime() >= startTime,
      );
      const holdCurve = simulation.holdCurve.filter(
        (p) => new Date(p.time).getTime() >= startTime,
      );
      const drawdownCurve = simulation.drawdownCurve.filter(
        (p) => new Date(p.time).getTime() >= startTime,
      );

      if (equityCurve.length === 0 || holdCurve.length === 0) {
        return errorJson(c, 400, "insufficient_market_data", "Not enough candles in range.", true);
      }

      const endingEquityUsd =
        equityCurve.at(-1)?.equity ?? simulation.summary.endingEquityUsd;
      const endingHoldEquityUsd =
        holdCurve.at(-1)?.equity ?? simulation.summary.endingHoldEquityUsd;
      const strategyReturnPercent = roundTo(
        ((endingEquityUsd - initialCapitalUsd) / initialCapitalUsd) * 100,
      );
      const holdReturnPercent = roundTo(
        ((endingHoldEquityUsd - initialCapitalUsd) / initialCapitalUsd) * 100,
      );

      return respondWithContract(c, backtestResponseSchema, {
        status: "ok",
        summary: {
          ...simulation.summary,
          endingEquityUsd,
          endingHoldEquityUsd,
          strategyReturnPercent,
          holdReturnPercent,
          alphaVsHoldPercent: roundTo(strategyReturnPercent - holdReturnPercent),
          maxDrawdownPercent: roundTo(
            drawdownCurve.reduce((max, p) => Math.max(max, p.drawdownPercent), 0),
          ),
        },
        equityCurve: equityCurve.map((p) => ({ time: p.time, equity: p.equity })),
        holdCurve: holdCurve.map((p) => ({ time: p.time, equity: p.equity })),
        candlesUsed: candles.length,
      });
    } catch (error: unknown) {
      console.error("[v2/strategy/backtest]", error instanceof Error ? error.message : error);
      return errorJson(c, 500, "internal_error", "Backtest is temporarily unavailable.", true);
    }
  });

  return app;
}
