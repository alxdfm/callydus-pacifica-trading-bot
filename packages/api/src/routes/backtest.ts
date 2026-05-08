import { Hono } from "hono";
import type { AppDeps } from "../app.js";
import type { HonoEnv } from "../middleware/auth.js";
import {
  materializeYourStrategyTechnicalContract,
  simulatePresetBacktest,
  getIntervalDurationMs,
  getRequiredPeriod,
  toPacificaMarketSymbol,
  EquityDepletedError,
  type YourStrategyDraft,
  type MarketCandleInterval,
} from "../engine/evaluator.js";
import { PacificaClient } from "../exchange/pacifica/client.js";

function calculateReturnPercent(initialCapitalUsd: number, endingEquityUsd: number) {
  const factor = 10 ** 4;
  return Math.round((((endingEquityUsd - initialCapitalUsd) / initialCapitalUsd) * 100) * factor) / factor;
}

function roundTo(value: number, decimals = 2): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export function backtestRoutes(deps: AppDeps): Hono<HonoEnv> {
  const app = new Hono<HonoEnv>();

  // POST /api/backtest/preview
  app.post("/preview", async (c) => {
    let body: {
      walletAddress?: unknown;
      draft?: unknown;
      startTime?: unknown;
      endTime?: unknown;
      initialCapitalUsd?: unknown;
      leverage?: unknown;
      feePercent?: unknown;
      slippagePercent?: unknown;
      priceSource?: unknown;
    };
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: "Invalid JSON" }, 400);
    }

    const startTime = Number(body.startTime);
    const endTime = Number(body.endTime);
    const initialCapitalUsd = Number(body.initialCapitalUsd ?? 1000);
    const leverage = Number(body.leverage ?? 1);
    const feePercent = Number(body.feePercent ?? 0);
    const slippagePercent = Number(body.slippagePercent ?? 0);

    if (!Number.isFinite(startTime) || !Number.isFinite(endTime) || endTime <= startTime) {
      return c.json(
        { status: "error", code: "invalid_period", message: "Backtest period is invalid.", retryable: false },
        400,
      );
    }

    const draft = body.draft as YourStrategyDraft | undefined;

    if (!draft) {
      return c.json(
        { status: "error", code: "strategy_not_found", message: "Provide a strategy draft.", retryable: false },
        400,
      );
    }

    const materialized = materializeYourStrategyTechnicalContract(draft);

    if (materialized.technicalContract === null) {
      return c.json(
        {
          status: "error",
          code: "strategy_not_executable",
          message: "YOUR Strategy must be executable before running backtest preview.",
          retryable: false,
          activationBlockers: materialized.activationBlockers,
        },
        400,
      );
    }

    const technicalContract = materialized.technicalContract;
    const marketSymbol = toPacificaMarketSymbol(technicalContract.symbol);

    if (!marketSymbol) {
      return c.json(
        { status: "error", code: "unsupported_symbol", message: "Unsupported symbol.", retryable: false },
        400,
      );
    }

    const intervalMs = getIntervalDurationMs(technicalContract.timeframe as MarketCandleInterval);
    const requiredPeriod = getRequiredPeriod(technicalContract);
    const warmupStartTime = startTime - intervalMs * Math.max(requiredPeriod + 5, 30);
    const candleLimit = Math.ceil((endTime - warmupStartTime) / intervalMs);

    try {
      // Use a public candle fetch — no credentials needed
      const response = await fetch(
        `${deps.env.PACIFICA_REST_BASE_URL}/api/v1/klines?symbol=${marketSymbol}&interval=${technicalContract.timeframe}&startTime=${Math.max(0, warmupStartTime)}&endTime=${endTime}&limit=${candleLimit}`,
        { headers: { Accept: "application/json" } },
      );

      if (!response.ok) {
        return c.json(
          { status: "error", code: "provider_unavailable", message: "Market data provider is unavailable.", retryable: true },
          503,
        );
      }

      const rawPayload = await response.json() as unknown;
      const rawData =
        rawPayload && typeof rawPayload === "object" && "data" in rawPayload
          ? (rawPayload as { data?: unknown }).data
          : rawPayload;

      if (!Array.isArray(rawData)) {
        return c.json(
          { status: "error", code: "insufficient_market_data", message: "No market data returned.", retryable: true },
          400,
        );
      }

      const candles = rawData.flatMap((item) => {
        if (!item || typeof item !== "object") return [];
        const row = item as Record<string, unknown>;
        const openTime = Number(row.openTime ?? row.open_time ?? row.t);
        const closeTime = Number(row.closeTime ?? row.close_time ?? row.T);
        const open = Number(row.open ?? row.o);
        const high = Number(row.high ?? row.h);
        const low = Number(row.low ?? row.l);
        const close = Number(row.close ?? row.c);
        const volume = Number(row.volume ?? row.v ?? 0);
        if (!Number.isFinite(openTime) || !Number.isFinite(closeTime) || !Number.isFinite(open) || !Number.isFinite(high) || !Number.isFinite(low) || !Number.isFinite(close)) return [];
        return [{ symbol: marketSymbol, interval: technicalContract.timeframe, openTime, closeTime, open, high, low, close, volume }];
      });

      const inPeriodCandles = candles.filter((c) => c.closeTime >= startTime);

      if (candles.length < requiredPeriod + 3 || inPeriodCandles.length < 2) {
        return c.json(
          { status: "error", code: "insufficient_market_data", message: "Not enough candles for simulation.", retryable: true },
          400,
        );
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
          return c.json(
            { status: "error", code: "internal_error", message: error.message, retryable: false },
            400,
          );
        }
        const msg = error instanceof Error && error.message.trim() ? error.message : "Not enough candles.";
        return c.json(
          { status: "error", code: "insufficient_market_data", message: msg, retryable: true },
          400,
        );
      }

      const trimmedEquityCurve = simulation.equityCurve.filter(
        (p) => new Date(p.time).getTime() >= startTime,
      );
      const trimmedHoldCurve = simulation.holdCurve.filter(
        (p) => new Date(p.time).getTime() >= startTime,
      );
      const trimmedDrawdownCurve = simulation.drawdownCurve.filter(
        (p) => new Date(p.time).getTime() >= startTime,
      );

      if (trimmedEquityCurve.length === 0 || trimmedHoldCurve.length === 0) {
        return c.json(
          { status: "error", code: "insufficient_market_data", message: "Not enough candles in range.", retryable: true },
          400,
        );
      }

      const endingEquityUsd = trimmedEquityCurve.at(-1)?.equity ?? simulation.summary.endingEquityUsd;
      const endingHoldEquityUsd = trimmedHoldCurve.at(-1)?.equity ?? simulation.summary.endingHoldEquityUsd;
      const strategyReturnPercent = calculateReturnPercent(initialCapitalUsd, endingEquityUsd);
      const holdReturnPercent = calculateReturnPercent(initialCapitalUsd, endingHoldEquityUsd);

      return c.json({
        status: "success",
        strategyId: null,
        symbol: technicalContract.symbol,
        marketSymbol,
        timeframe: technicalContract.timeframe,
        priceSource: body.priceSource ?? "market",
        periodStart: new Date(startTime).toISOString(),
        periodEnd: new Date(endTime).toISOString(),
        candlesUsed: candles.length,
        summary: {
          ...simulation.summary,
          endingEquityUsd,
          endingHoldEquityUsd,
          strategyReturnPercent,
          holdReturnPercent,
          alphaVsHoldPercent: roundTo(strategyReturnPercent - holdReturnPercent, 4),
          maxDrawdownPercent: roundTo(
            trimmedDrawdownCurve.reduce((max, p) => Math.max(max, p.drawdownPercent), 0),
            4,
          ),
        },
        equityCurve: trimmedEquityCurve,
        holdCurve: trimmedHoldCurve,
        drawdownCurve: trimmedDrawdownCurve,
        trades: simulation.trades.filter(
          (t) => new Date(t.openedAt).getTime() >= startTime,
        ),
        assumptions: {
          executionModel:
            "Signals are evaluated on candle close and simulated entries occur on the next candle open.",
          positionRule:
            "Only one open position per symbol is allowed.",
          tpSlConflictRule:
            "If stop loss and take profit are both touched within the same candle, stop loss is applied first.",
          feePercent: roundTo(feePercent, 4),
          slippagePercent: roundTo(slippagePercent, 4),
        },
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error("[backtest-preview]", message);
      return c.json(
        { status: "error", code: "internal_error", message: "Backtest preview is temporarily unavailable.", retryable: false },
        500,
      );
    }
  });

  return app;
}
