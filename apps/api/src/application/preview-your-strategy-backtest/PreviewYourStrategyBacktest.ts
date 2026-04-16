import {
  createYourStrategyDraftFingerprint,
  type YourStrategyBacktestPreviewRequest,
  type YourStrategyBacktestPreviewResponse,
  type YourStrategyDraft,
} from "@pacifica/contracts";
import {
  getIntervalDurationMs,
  getRequiredPeriod,
  materializeYourStrategyTechnicalContract,
  simulatePresetBacktest,
  toPacificaMarketSymbol,
} from "@pacifica/preset-engine";
import { PacificaApiError } from "../../infrastructure/pacifica/PacificaClient";
import type { MarketDataPort } from "../../domain/market-data/MarketDataPort";
import type { YourStrategyRepository } from "../../domain/your-strategy/YourStrategyRepository";

export type PreviewYourStrategyBacktestDependencies = {
  marketData: MarketDataPort;
  repository: YourStrategyRepository;
  refresher?: {
    refreshCandles(input: {
      requests: Array<{
        symbol: string;
        interval: YourStrategyBacktestPreviewRequest["draft"] extends never
          ? never
          : "3m" | "5m" | "15m" | "30m" | "1h" | "2h" | "4h" | "6h" | "12h" | "1d" | "1m";
        priceSource: "market" | "mark";
        startTime: number;
        endTime: number;
        limit: number;
      }>;
    }): Promise<unknown>;
  };
};

/**
 * Creates the backtest preview use case for the account-scoped YOUR Strategy.
 *
 * Responsibility:
 * - resolve the draft from the request or from persisted account state
 * - materialize the custom draft into the canonical technical contract
 * - run the same simulation model already used by preset preview
 *
 * Non-responsibility:
 * - it does not persist changes to the strategy draft
 * - it does not activate the strategy
 */
export function createPreviewYourStrategyBacktest(
  dependencies: PreviewYourStrategyBacktestDependencies,
) {
  /**
   * Simulates the current YOUR Strategy over the requested market window.
   */
  return async function previewYourStrategyBacktest(
    input: YourStrategyBacktestPreviewRequest,
  ): Promise<YourStrategyBacktestPreviewResponse> {
    if (input.endTime <= input.startTime) {
      return {
        status: "error",
        code: "invalid_period",
        message: "Backtest period is invalid.",
        retryable: false,
      };
    }

    const persistedStrategy =
      input.draft === undefined
        ? await dependencies.repository.findYourStrategyByWalletAddress(
            input.walletAddress,
          )
        : null;
    const draft: YourStrategyDraft | null = input.draft ?? persistedStrategy?.draft ?? null;

    if (!draft) {
      return {
        status: "error",
        code: "strategy_not_found",
        message: "YOUR Strategy was not found for this wallet.",
        retryable: false,
      };
    }

    const materialized = materializeYourStrategyTechnicalContract(draft);

    if (materialized.technicalContract === null) {
      return {
        status: "error",
        code: "strategy_not_executable",
        message: "YOUR Strategy must be executable before running backtest preview.",
        retryable: false,
        activationBlockers: materialized.activationBlockers,
      };
    }

    const technicalContract = materialized.technicalContract;
    const marketSymbol = toPacificaMarketSymbol(technicalContract.symbol);

    if (!marketSymbol) {
      return {
        status: "error",
        code: "unsupported_symbol",
        message: "Unsupported YOUR Strategy symbol for Pacifica market data.",
        retryable: false,
      };
    }

    const intervalMs = getIntervalDurationMs(technicalContract.timeframe);
    const requiredPeriod = getRequiredPeriod(technicalContract);
    const warmupStartTime =
      input.startTime - intervalMs * Math.max(requiredPeriod + 5, 30);
    const candleLimit = Math.ceil((input.endTime - warmupStartTime) / intervalMs);

    const candleRequest = {
      symbol: marketSymbol,
      interval: technicalContract.timeframe,
      priceSource: input.priceSource,
      startTime: Math.max(0, warmupStartTime),
      endTime: input.endTime,
      limit: candleLimit,
    } as const;

    try {
      let candles = await loadCandlesWithPreviewFallback({
        marketData: dependencies.marketData,
        refresher: dependencies.refresher,
        request: candleRequest,
      });

      const inPeriodCandles = candles.filter(
        (candle) => candle.closeTime >= input.startTime,
      );

      if (candles.length < requiredPeriod + 3 || inPeriodCandles.length < 2) {
        candles = await refreshAndReloadCandlesForPreview({
          marketData: dependencies.marketData,
          refresher: dependencies.refresher,
          request: candleRequest,
          fallbackCandles: candles,
        });
      }

      const inPeriodCandlesAfterRefresh = candles.filter(
        (candle) => candle.closeTime >= input.startTime,
      );

      if (
        candles.length < requiredPeriod + 3 ||
        inPeriodCandlesAfterRefresh.length < 2
      ) {
        return {
          status: "error",
          code: "insufficient_market_data",
          message:
            "Not enough market candles were returned to simulate this YOUR Strategy.",
          retryable: true,
        };
      }

      let simulation: ReturnType<typeof simulatePresetBacktest>;

      try {
        simulation = simulatePresetBacktest({
          technicalContract,
          candles,
          initialCapitalUsd: input.initialCapitalUsd,
          leverage: input.leverage,
          feePercent: input.feePercent,
          slippagePercent: input.slippagePercent,
        });
      } catch (error) {
        return {
          status: "error",
          code: "insufficient_market_data",
          message:
            error instanceof Error && error.message.trim()
              ? error.message
              : "Not enough market candles were returned to simulate this YOUR Strategy.",
          retryable: true,
        };
      }

      const trimmedEquityCurve = simulation.equityCurve.filter(
        (point) => new Date(point.time).getTime() >= input.startTime,
      );
      const trimmedHoldCurve = simulation.holdCurve.filter(
        (point) => new Date(point.time).getTime() >= input.startTime,
      );
      const trimmedDrawdownCurve = simulation.drawdownCurve.filter(
        (point) => new Date(point.time).getTime() >= input.startTime,
      );

      if (trimmedEquityCurve.length === 0 || trimmedHoldCurve.length === 0) {
        return {
          status: "error",
          code: "insufficient_market_data",
          message:
            "Not enough market candles were returned to simulate this YOUR Strategy.",
          retryable: true,
        };
      }

      const response: YourStrategyBacktestPreviewResponse = {
        status: "success",
        strategyId: persistedStrategy?.id ?? null,
        symbol: technicalContract.symbol,
        marketSymbol,
        timeframe: technicalContract.timeframe,
        priceSource: input.priceSource,
        periodStart: new Date(input.startTime).toISOString(),
        periodEnd: new Date(input.endTime).toISOString(),
        candlesUsed: candles.length,
        summary: {
          ...simulation.summary,
          endingEquityUsd:
            trimmedEquityCurve.at(-1)?.equity ?? simulation.summary.endingEquityUsd,
          endingHoldEquityUsd:
            trimmedHoldCurve.at(-1)?.equity ?? simulation.summary.endingHoldEquityUsd,
          strategyReturnPercent: calculateReturnPercent(
            input.initialCapitalUsd,
            trimmedEquityCurve.at(-1)?.equity ?? simulation.summary.endingEquityUsd,
          ),
          holdReturnPercent: calculateReturnPercent(
            input.initialCapitalUsd,
            trimmedHoldCurve.at(-1)?.equity ?? simulation.summary.endingHoldEquityUsd,
          ),
          alphaVsHoldPercent: roundTo(
            calculateReturnPercent(
              input.initialCapitalUsd,
              trimmedEquityCurve.at(-1)?.equity ?? simulation.summary.endingEquityUsd,
            ) -
              calculateReturnPercent(
                input.initialCapitalUsd,
                trimmedHoldCurve.at(-1)?.equity ??
                  simulation.summary.endingHoldEquityUsd,
              ),
            4,
          ),
          maxDrawdownPercent: roundTo(
            trimmedDrawdownCurve.reduce(
              (max, point) => Math.max(max, point.drawdownPercent),
              0,
            ),
            4,
          ),
        },
        equityCurve: trimmedEquityCurve,
        holdCurve: trimmedHoldCurve,
        drawdownCurve: trimmedDrawdownCurve,
        trades: simulation.trades.filter(
          (trade) => new Date(trade.openedAt).getTime() >= input.startTime,
        ),
        assumptions: {
          executionModel:
            "Signals are evaluated on candle close and simulated entries occur on the next candle open.",
          positionRule:
            "Only one open position per symbol is allowed, matching the runtime execution contract.",
          tpSlConflictRule:
            "If stop loss and take profit are both touched within the same candle, stop loss is applied first.",
          feePercent: roundTo(input.feePercent, 4),
          slippagePercent: roundTo(input.slippagePercent, 4),
        },
      };

      if (persistedStrategy?.id) {
        await dependencies.repository.recordSuccessfulYourStrategyBacktestPreview({
          walletAddress: input.walletAddress,
          fingerprint: createYourStrategyDraftFingerprint(draft),
          previewedAtIso: new Date().toISOString(),
        });
      }

      return response;
    } catch (error) {
      if (error instanceof PacificaApiError) {
        return {
          status: "error",
          code: error.details.retryable ? "provider_unavailable" : "internal_error",
          message: extractPacificaErrorMessage(error.details.body, error.message),
          retryable: error.details.retryable,
        };
      }

      const genericError = mapGenericPreviewError(error);

      if (genericError) {
        return genericError;
      }

      return {
        status: "error",
        code: "internal_error",
        message: "YOUR Strategy backtest preview is temporarily unavailable.",
        retryable: false,
      };
    }
  };
}

function extractPacificaErrorMessage(body: unknown, fallback: string): string {
  const apiMessage = (body as { error?: unknown } | null)?.error;

  if (typeof apiMessage === "string" && apiMessage.trim()) {
    return apiMessage;
  }

  const rawMessage = (body as { raw?: unknown } | null)?.raw;

  if (typeof rawMessage === "string" && rawMessage.trim()) {
    return rawMessage;
  }

  return fallback;
}

async function loadCandlesWithPreviewFallback(input: {
  marketData: MarketDataPort;
  refresher?: PreviewYourStrategyBacktestDependencies["refresher"];
  request: {
    symbol: string;
    interval: "1m" | "3m" | "5m" | "15m" | "30m" | "1h" | "2h" | "4h" | "6h" | "12h" | "1d";
    priceSource: "market" | "mark";
    startTime: number;
    endTime: number;
    limit: number;
  };
}) {
  try {
    return await input.marketData.getCandles(input.request);
  } catch (error) {
    if (!shouldTriggerHistoricalRefresh(error) || !input.refresher) {
      throw error;
    }

    await input.refresher.refreshCandles({
      requests: [input.request],
    });

    return input.marketData.getCandles(input.request);
  }
}

async function refreshAndReloadCandlesForPreview(input: {
  marketData: MarketDataPort;
  refresher?: PreviewYourStrategyBacktestDependencies["refresher"];
  request: {
    symbol: string;
    interval: "1m" | "3m" | "5m" | "15m" | "30m" | "1h" | "2h" | "4h" | "6h" | "12h" | "1d";
    priceSource: "market" | "mark";
    startTime: number;
    endTime: number;
    limit: number;
  };
  fallbackCandles: Awaited<ReturnType<MarketDataPort["getCandles"]>>;
}) {
  if (!input.refresher) {
    return input.fallbackCandles;
  }

  try {
    await input.refresher.refreshCandles({
      requests: [input.request],
    });

    return await input.marketData.getCandles(input.request);
  } catch {
    return input.fallbackCandles;
  }
}

function shouldTriggerHistoricalRefresh(error: unknown) {
  return (
    error instanceof Error &&
    error.message.trim().includes("snapshot is unavailable")
  );
}

function mapGenericPreviewError(error: unknown) {
  if (!(error instanceof Error)) {
    return null;
  }

  const message = error.message.trim();

  if (!message) {
    return null;
  }

  if (message.includes("snapshot is unavailable")) {
    return {
      status: "error" as const,
      code: "provider_unavailable" as const,
      message,
      retryable: true,
    };
  }

  return null;
}

function calculateReturnPercent(initialCapitalUsd: number, endingEquityUsd: number) {
  return roundTo(
    ((endingEquityUsd - initialCapitalUsd) / initialCapitalUsd) * 100,
    4,
  );
}

function roundTo(value: number, decimals = 2) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}
