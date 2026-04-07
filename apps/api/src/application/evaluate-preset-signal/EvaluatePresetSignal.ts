import {
  getPresetTechnicalContractByDefinitionId,
  type PresetSignalEvaluationRequest,
  type PresetSignalEvaluationResponse,
} from "@pacifica/contracts";
import {
  buildPresetRiskPlans,
  evaluatePresetSignal,
  getIntervalDurationMs,
  getRequiredPeriod,
  materializeEffectivePresetContract,
  toPacificaMarketSymbol,
} from "@pacifica/preset-engine";
import { PacificaApiError } from "@pacifica/pacifica-market-data";
import type { OperationalEventRepository } from "../../domain/operational-events/OperationalEventRepository";
import type { MarketDataPort as MarketDataPortType } from "../../domain/market-data/MarketDataPort";

export type EvaluatePresetSignalDependencies = {
  marketData: MarketDataPortType;
  eventRepository?: OperationalEventRepository;
  now?: () => Date;
};

/**
 * Creates the preset-signal evaluation use case.
 *
 * Responsibility:
 * - resolve the canonical preset technical contract
 * - fetch the required market candles from Pacifica-backed market data
 * - evaluate indicators, entry rules and derived risk plans
 */
export function createEvaluatePresetSignal(
  dependencies: EvaluatePresetSignalDependencies,
) {
  const getNow = dependencies.now ?? (() => new Date());

  /**
   * Evaluates whether the preset currently emits a long/short signal.
   */
  return async function evaluateSignal(
    input: PresetSignalEvaluationRequest,
  ): Promise<PresetSignalEvaluationResponse> {
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

    const technicalContract = materializeEffectivePresetContract(
      baseContract,
      input.editableConfig,
    );

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

      let riskPlans: ReturnType<typeof buildPresetRiskPlans>;

      try {
        riskPlans = buildPresetRiskPlans(
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

      await dependencies.eventRepository?.appendOperationalEvent({
        eventType: "signal_evaluation",
        severity: "info",
        title: "Preset signal evaluated",
        message: `Signal ${evaluation.signal} evaluated for ${input.editableConfig.symbol}.`,
        payloadJson: {
          presetDefinitionId: input.presetDefinitionId,
          symbol: input.editableConfig.symbol,
          marketSymbol,
          signal: evaluation.signal,
          evaluatedAt: getNow().toISOString(),
        },
      });

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
