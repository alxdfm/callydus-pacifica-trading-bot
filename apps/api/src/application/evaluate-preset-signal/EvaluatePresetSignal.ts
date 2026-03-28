import {
  getPresetTechnicalContractByDefinitionId,
  type MarketCandleInterval,
  type PresetSignalEvaluationRequest,
  type PresetSignalEvaluationResponse,
} from "@pacifica/contracts";
import { PacificaApiError } from "../../infrastructure/pacifica/PacificaClient";
import { evaluatePresetSignal } from "../../domain/preset-signals/evaluatePresetSignal";
import type { MarketDataPort as MarketDataPortType } from "../../domain/market-data/MarketDataPort";

export type EvaluatePresetSignalDependencies = {
  marketData: MarketDataPortType;
  now?: () => Date;
};

export function createEvaluatePresetSignal(
  dependencies: EvaluatePresetSignalDependencies,
) {
  const getNow = dependencies.now ?? (() => new Date());

  return async function evaluateSignal(
    input: PresetSignalEvaluationRequest,
  ): Promise<PresetSignalEvaluationResponse> {
    const technicalContract = getPresetTechnicalContractByDefinitionId(
      input.presetDefinitionId,
    );

    if (!technicalContract) {
      return {
        status: "error",
        code: "preset_not_found",
        message: "Preset technical contract not found.",
        retryable: false,
      };
    }

    const marketSymbol = toPacificaMarketSymbol(input.editableConfig.symbol);

    if (!marketSymbol) {
      return {
        status: "error",
        code: "unsupported_symbol",
        message: "Unsupported preset symbol for Pacifica market data.",
        retryable: false,
      };
    }

    const requiredPeriod = getRequiredPeriod(technicalContract);
    const candleLimit = Math.max(120, requiredPeriod * 5);
    const endTime = getNow().getTime();
    const startTime =
      endTime -
      candleLimit * getIntervalDurationMs(technicalContract.timeframe);

    try {
      const candles = await dependencies.marketData.getCandles({
        symbol: marketSymbol,
        interval: technicalContract.timeframe,
        priceSource: input.priceSource,
        startTime,
        endTime,
        limit: candleLimit,
      });

      if (candles.length < requiredPeriod + 3) {
        return {
          status: "error",
          code: "insufficient_market_data",
          message:
            "Not enough market candles were returned to evaluate the preset signal.",
          retryable: true,
        };
      }

      const evaluation = evaluatePresetSignal(technicalContract, candles);
      const entryReferencePrice = candles[candles.length - 1]?.close;

      if (typeof entryReferencePrice !== "number" || !Number.isFinite(entryReferencePrice)) {
        return {
          status: "error",
          code: "insufficient_market_data",
          message:
            "Could not determine the reference entry price from the latest candle.",
          retryable: true,
        };
      }

      let riskPlans: ReturnType<typeof buildRiskPlans>;

      try {
        riskPlans = buildRiskPlans(
          technicalContract,
          evaluation.indicators,
          entryReferencePrice,
        );
      } catch (error) {
        return {
          status: "error",
          code: "insufficient_market_data",
          message:
            error instanceof Error
              ? error.message
              : "Could not derive preset risk levels from current market data.",
          retryable: true,
        };
      }

      return {
        status: "success",
        presetDefinitionId: input.presetDefinitionId,
        symbol: input.editableConfig.symbol,
        marketSymbol,
        timeframe: technicalContract.timeframe,
        priceSource: input.priceSource,
        evaluatedAt: getNow().toISOString(),
        candlesUsed: candles.length,
        signal: evaluation.signal,
        longSignal: evaluation.longSignal,
        shortSignal: evaluation.shortSignal,
        entryReferencePrice,
        indicators: evaluation.indicators,
        longRiskPlan: riskPlans.long,
        shortRiskPlan: riskPlans.short,
        longRuleEvaluations: evaluation.longRuleEvaluations,
        shortRuleEvaluations: evaluation.shortRuleEvaluations,
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
        message: "Preset signal evaluation is temporarily unavailable.",
        retryable: false,
      };
    }
  };
}

function buildRiskPlans(
  technicalContract: NonNullable<
    ReturnType<typeof getPresetTechnicalContractByDefinitionId>
  >,
  indicators: Record<string, { previous: number | null; current: number | null }>,
  entryPrice: number,
) {
  const riskDistance = resolveRiskDistance(
    technicalContract,
    indicators,
    entryPrice,
  );

  return {
    long: {
      side: "long" as const,
      entryPrice,
      stopLossPrice: entryPrice - riskDistance,
      takeProfitPrice: entryPrice + riskDistance * technicalContract.risk.takeProfit.multiple,
      riskDistance,
    },
    short: {
      side: "short" as const,
      entryPrice,
      stopLossPrice: entryPrice + riskDistance,
      takeProfitPrice: entryPrice - riskDistance * technicalContract.risk.takeProfit.multiple,
      riskDistance,
    },
  };
}

function resolveRiskDistance(
  technicalContract: NonNullable<
    ReturnType<typeof getPresetTechnicalContractByDefinitionId>
  >,
  indicators: Record<string, { previous: number | null; current: number | null }>,
  entryPrice: number,
) {
  if (technicalContract.risk.stopLoss.mode === "static") {
    return entryPrice * (technicalContract.risk.stopLoss.value / 100);
  }

  const atrIndicator = findAtrIndicatorName(technicalContract);
  const atrValue =
    (atrIndicator ? indicators[atrIndicator]?.current : null) ?? null;

  if (typeof atrValue === "number" && Number.isFinite(atrValue) && atrValue > 0) {
    return atrValue * technicalContract.risk.stopLoss.multiplier;
  }

  throw new Error("ATR-based stop loss could not be derived from indicator evaluation.");
}

function findAtrIndicatorName(
  technicalContract: NonNullable<
    ReturnType<typeof getPresetTechnicalContractByDefinitionId>
  >,
) {
  for (const [indicatorName, indicatorConfig] of Object.entries(
    technicalContract.indicators,
  )) {
    if (indicatorConfig.type === "atr") {
      return indicatorName;
    }
  }

  return null;
}

function toPacificaMarketSymbol(symbol: string) {
  const match = symbol.match(/^([A-Z]+)\/USDC$/);
  return match?.[1] ?? null;
}

function getRequiredPeriod(
  technicalContract: NonNullable<
    ReturnType<typeof getPresetTechnicalContractByDefinitionId>
  >,
) {
  const indicatorPeriods = Object.values(technicalContract.indicators).map((indicator) => {
    switch (indicator.type) {
      case "ema":
      case "rsi":
      case "atr":
      case "sma":
        return indicator.period;
      case "volume":
        return 1;
    }
  });

  const stopLossPeriod =
    technicalContract.risk.stopLoss.mode === "atr"
      ? technicalContract.risk.stopLoss.period
      : 1;

  return Math.max(...indicatorPeriods, stopLossPeriod);
}

function getIntervalDurationMs(interval: MarketCandleInterval) {
  switch (interval) {
    case "1m":
      return 60_000;
    case "3m":
      return 180_000;
    case "5m":
      return 300_000;
    case "15m":
      return 900_000;
    case "30m":
      return 1_800_000;
    case "1h":
      return 3_600_000;
    case "2h":
      return 7_200_000;
    case "4h":
      return 14_400_000;
    case "6h":
      return 21_600_000;
    case "12h":
      return 43_200_000;
    case "1d":
      return 86_400_000;
  }
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
