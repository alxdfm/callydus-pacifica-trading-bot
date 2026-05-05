import {
  createYourStrategyDraftFingerprint,
  type YourStrategyBacktestPreviewRequest,
  type YourStrategyBacktestPreviewResponse,
  type YourStrategyDraft,
} from "@pacifica/contracts";
import {
  EquityDepletedError,
  getIntervalDurationMs,
  getRequiredPeriod,
  materializeYourStrategyTechnicalContract,
  simulatePresetBacktest,
  toPacificaMarketSymbol,
} from "@pacifica/preset-engine";
import { PacificaApiError } from "@pacifica/pacifica-market-data";
import type { MarketCandle, MarketCandleRequest } from "@pacifica/contracts";
import type { YourStrategyRepository } from "../../domain/your-strategy/YourStrategyRepository";

type CandleSource = {
  getCandles(request: MarketCandleRequest): Promise<MarketCandle[]>;
};

export type PreviewYourStrategyBacktestDependencies = {
  marketData?: CandleSource;
  repository: YourStrategyRepository;
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

    if (!dependencies.marketData) {
      return {
        status: "error",
        code: "provider_unavailable",
        message: "Market data provider is not configured.",
        retryable: false,
      };
    }

    try {
      const candles = await dependencies.marketData.getCandles(candleRequest);

      const inPeriodCandlesAfterRefresh = candles.filter(
        (candle) => candle.closeTime >= input.startTime,
      );

      if (candles.length < requiredPeriod + 3 || inPeriodCandlesAfterRefresh.length < 2) {
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
        if (error instanceof EquityDepletedError) {
          return {
            status: "error",
            code: "internal_error",
            message: error.message,
            retryable: false,
          };
        }

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
