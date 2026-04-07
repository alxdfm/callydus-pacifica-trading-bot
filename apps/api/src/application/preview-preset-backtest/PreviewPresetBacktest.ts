import {
  getPresetTechnicalContractByDefinitionId,
  type PresetBacktestPreviewRequest,
  type PresetBacktestPreviewResponse,
} from "@pacifica/contracts";
import {
  getIntervalDurationMs,
  getRequiredPeriod,
  materializeEffectivePresetContract,
  simulatePresetBacktest,
  toPacificaMarketSymbol,
} from "@pacifica/preset-engine";
import { PacificaApiError } from "../../infrastructure/pacifica/PacificaClient";
import type { MarketDataPort } from "../../domain/market-data/MarketDataPort";

export type PreviewPresetBacktestDependencies = {
  marketData: MarketDataPort;
};

export function createPreviewPresetBacktest(
  dependencies: PreviewPresetBacktestDependencies,
) {
  return async function previewPresetBacktest(
    input: PresetBacktestPreviewRequest,
  ): Promise<PresetBacktestPreviewResponse> {
    const baseContract = getPresetTechnicalContractByDefinitionId(
      input.presetDefinitionId,
    );

    if (!baseContract) {
      return {
        status: "error",
        code: "preset_not_found",
        message: "Preset technical contract not found.",
        retryable: false,
      };
    }

    if (input.endTime <= input.startTime) {
      return {
        status: "error",
        code: "invalid_period",
        message: "Backtest period is invalid.",
        retryable: false,
      };
    }

    const technicalContract = materializeEffectivePresetContract(
      baseContract,
      input.editableConfig,
    );
    const marketSymbol = toPacificaMarketSymbol(technicalContract.symbol);

    if (!marketSymbol) {
      return {
        status: "error",
        code: "unsupported_symbol",
        message: "Unsupported preset symbol for Pacifica market data.",
        retryable: false,
      };
    }

    const intervalMs = getIntervalDurationMs(technicalContract.timeframe);
    const requiredPeriod = getRequiredPeriod(technicalContract);
    const warmupStartTime =
      input.startTime - intervalMs * Math.max(requiredPeriod + 5, 30);
    const candleLimit = Math.ceil((input.endTime - warmupStartTime) / intervalMs) + 2;

    try {
      const candles = await dependencies.marketData.getCandles({
        symbol: marketSymbol,
        interval: technicalContract.timeframe,
        priceSource: input.priceSource,
        startTime: Math.max(0, warmupStartTime),
        endTime: input.endTime,
        limit: candleLimit,
      });

      const inPeriodCandles = candles.filter(
        (candle) => candle.closeTime >= input.startTime,
      );

      if (candles.length < requiredPeriod + 3 || inPeriodCandles.length < 2) {
        return {
          status: "error",
          code: "insufficient_market_data",
          message: "Not enough market candles were returned to simulate this preset.",
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
              : "Not enough market candles were returned to simulate this preset.",
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
          message: "Not enough market candles were returned to simulate this preset.",
          retryable: true,
        };
      }

      return {
        status: "success",
        presetDefinitionId: input.presetDefinitionId,
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
    } catch (error) {
      if (error instanceof PacificaApiError) {
        return {
          status: "error",
          code: error.details.retryable ? "provider_unavailable" : "internal_error",
          message: extractPacificaErrorMessage(error.details.body, error.message),
          retryable: error.details.retryable,
        };
      }

      return {
        status: "error",
        code: "internal_error",
        message: "Preset backtest preview is temporarily unavailable.",
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
