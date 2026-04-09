import { describe, expect, it } from "vitest";
import type {
  MarketCandle,
  PresetTechnicalContract,
  YourStrategyDraft,
} from "@pacifica/contracts";
import {
  buildPresetRiskPlans,
  evaluatePresetSignal,
  getIntervalDurationMs,
  getRequiredPeriod,
  materializeEffectivePresetContract,
  materializeYourStrategyTechnicalContract,
  simulatePresetBacktest,
  toPacificaMarketSymbol,
} from "./index";

function createCandle(
  closeTime: number,
  close: number,
  volume: number,
  high = close + 2,
  low = close - 2,
): MarketCandle {
  return {
    symbol: "BTC/USDC",
    interval: "1m",
    openTime: closeTime - 60_000,
    closeTime,
    open: close,
    high,
    low,
    close,
    volume,
  };
}

function createContract(
  overrides: Partial<PresetTechnicalContract> = {},
): PresetTechnicalContract {
  return {
    name: "Test",
    version: 1,
    timeframe: "1m",
    symbol: "BTC/USDC",
    indicators: {
      volume: { type: "volume" },
      volumeSma: { type: "sma", source: "volume", period: 2 },
      atr: { type: "atr", period: 3 },
    },
    entry: {
      long: {
        enabled: true,
        trigger: {
          type: "all",
          rules: [
            {
              scope: "currentCandle",
              type: "threshold",
              indicator: "volume",
              operator: "above",
              value: 100,
            },
          ],
        },
      },
      short: {
        enabled: false,
        trigger: {
          type: "all",
          rules: [
            {
              scope: "currentCandle",
              type: "threshold",
              indicator: "volume",
              operator: "below",
              value: 50,
            },
          ],
        },
      },
    },
    risk: {
      stopLoss: {
        mode: "static",
        unit: "percent",
        value: 10,
      },
      takeProfit: {
        mode: "rr",
        multiple: 2,
      },
    },
    execution: {
      positionSize: {
        type: "fixedPercent",
        value: 5,
      },
      onePositionPerSymbol: true,
      manualCloseAllowed: true,
      closeOppositePositionOnSignal: true,
    },
    ...overrides,
  };
}

function createYourStrategyDraft(
  overrides: Partial<YourStrategyDraft> = {},
): YourStrategyDraft {
  return {
    name: "YOUR Strategy",
    symbol: "BTC/USDC",
    timeframe: "5m",
    indicators: {
      volume: { type: "volume" },
    },
    entry: {
      long: {
        enabled: true,
        trigger: {
          type: "all",
          rules: [
            {
              scope: "currentCandle",
              type: "threshold",
              indicator: "volume",
              operator: "above",
              value: 100,
            },
          ],
        },
      },
      short: {
        enabled: false,
        trigger: {
          type: "all",
          rules: [
            {
              scope: "currentCandle",
              type: "threshold",
              indicator: "volume",
              operator: "below",
              value: 50,
            },
          ],
        },
      },
    },
    risk: {
      stopLoss: {
        mode: "static",
        unit: "percent",
        value: 3,
      },
      takeProfit: {
        mode: "rr",
        multiple: 2,
      },
    },
    positionSizeType: "balance_percent",
    positionSizeValue: 5,
    ...overrides,
  };
}

describe("preset-engine", () => {
  it("avalia sinal long quando o grupo de regras habilitado passa", () => {
    const contract = createContract();
    const candles = [
      createCandle(60_000, 100, 50),
      createCandle(120_000, 102, 80),
      createCandle(180_000, 104, 110),
      createCandle(240_000, 105, 150),
    ];

    const result = evaluatePresetSignal(contract, candles);

    expect(result.signal).toBe("long");
    expect(result.longSignal).toBe(true);
    expect(result.shortSignal).toBe(false);
    expect(result.indicators.volume?.current).toBe(150);
    expect(result.longRuleEvaluations).toHaveLength(1);
    expect(result.longRuleEvaluations[0]?.satisfied).toBe(true);
  });

  it("retorna none quando long e short disparam ao mesmo tempo", () => {
    const contract = createContract({
      entry: {
        long: {
          enabled: true,
          trigger: {
            type: "all",
            rules: [
              {
                scope: "currentCandle",
                type: "threshold",
                indicator: "volume",
                operator: "atOrAbove",
                value: 150,
              },
            ],
          },
        },
        short: {
          enabled: true,
          trigger: {
            type: "all",
            rules: [
              {
                scope: "currentCandle",
                type: "threshold",
                indicator: "volume",
                operator: "atOrBelow",
                value: 150,
              },
            ],
          },
        },
      },
    });
    const candles = [
      createCandle(60_000, 100, 80),
      createCandle(120_000, 102, 100),
      createCandle(180_000, 104, 120),
      createCandle(240_000, 105, 150),
    ];

    const result = evaluatePresetSignal(contract, candles);

    expect(result.longSignal).toBe(true);
    expect(result.shortSignal).toBe(true);
    expect(result.signal).toBe("none");
  });

  it("constrói risk plans percentuais a partir do entry price", () => {
    const contract = createContract();

    const result = buildPresetRiskPlans(contract, {}, 100);

    expect(result.long).toEqual({
      side: "long",
      entryPrice: 100,
      stopLossPrice: 90,
      takeProfitPrice: 120,
      riskDistance: 10,
    });
    expect(result.short).toEqual({
      side: "short",
      entryPrice: 100,
      stopLossPrice: 110,
      takeProfitPrice: 80,
      riskDistance: 10,
    });
  });

  it("constrói risk plans baseados em ATR quando o preset exige volatilidade", () => {
    const contract = createContract({
      risk: {
        stopLoss: {
          mode: "atr",
          period: 14,
          multiplier: 1.5,
        },
        takeProfit: {
          mode: "rr",
          multiple: 2,
        },
      },
    });

    const result = buildPresetRiskPlans(
      contract,
      {
        atr: {
          previous: 4,
          current: 5,
        },
      },
      100,
    );

    expect(result.long.riskDistance).toBe(7.5);
    expect(result.long.stopLossPrice).toBe(92.5);
    expect(result.short.takeProfitPrice).toBe(85);
  });

  it("falha quando o preset pede ATR mas o indicador não foi derivado", () => {
    const contract = createContract({
      risk: {
        stopLoss: {
          mode: "atr",
          period: 14,
          multiplier: 2,
        },
        takeProfit: {
          mode: "rr",
          multiple: 2,
        },
      },
    });

    expect(() => buildPresetRiskPlans(contract, {}, 100)).toThrow(
      "ATR-based stop loss could not be derived from indicator evaluation.",
    );
  });

  it("resolve o maior período necessário entre indicadores e stop loss ATR", () => {
    const contract = createContract({
      indicators: {
        emaFast: { type: "ema", period: 9 },
        emaSlow: { type: "ema", period: 21 },
        rsi: { type: "rsi", period: 14 },
      },
      risk: {
        stopLoss: {
          mode: "atr",
          period: 30,
          multiplier: 1.2,
        },
        takeProfit: {
          mode: "rr",
          multiple: 2,
        },
      },
    });

    expect(getRequiredPeriod(contract)).toBe(30);
  });

  it("normaliza somente símbolos Pacifica suportados no formato BASE/USDC", () => {
    expect(toPacificaMarketSymbol("BTC/USDC")).toBe("BTC");
    expect(toPacificaMarketSymbol("eth/USDC")).toBeNull();
    expect(toPacificaMarketSymbol("BTC/USD")).toBeNull();
  });

  it("expõe a duração esperada do intervalo em milissegundos", () => {
    expect(getIntervalDurationMs("1m")).toBe(60_000);
    expect(getIntervalDurationMs("15m")).toBe(900_000);
    expect(getIntervalDurationMs("1d")).toBe(86_400_000);
  });

  it("materializa o contrato efetivo a partir da configuração editável", () => {
    const contract = createContract();

    const result = materializeEffectivePresetContract(contract, {
      symbol: "ETH/USDC",
      positionSizeType: "balance_percent",
      positionSizeValue: 12,
      longEnabled: false,
      shortEnabled: true,
    });

    expect(result.symbol).toBe("ETH/USDC");
    expect(result.entry.long.enabled).toBe(false);
    expect(result.entry.short.enabled).toBe(true);
    expect(result.execution.positionSize.value).toBe(12);
  });

  it("simula a estratégia candle a candle com entrada no próximo candle", () => {
    const contract = createContract();
    const candles = [
      createCandle(60_000, 100, 50),
      createCandle(120_000, 102, 80),
      createCandle(180_000, 104, 110),
      createCandle(240_000, 105, 150),
      {
        ...createCandle(300_000, 125, 120, 130, 100),
        open: 106,
      },
    ];

    const result = simulatePresetBacktest({
      technicalContract: contract,
      candles,
      initialCapitalUsd: 1000,
      leverage: 1,
      feePercent: 0,
      slippagePercent: 0,
    });

    expect(result.trades).toHaveLength(1);
    expect(result.trades[0]?.openedAt).toBe(new Date(240_000).toISOString());
    expect(result.trades[0]?.closeReason).toBe("take_profit");
    expect(result.summary.totalTrades).toBe(1);
    expect(result.summary.endingEquityUsd).toBeGreaterThan(1000);
  });

  it("materializa YOUR Strategy em contrato técnico quando o draft é executável", () => {
    const result = materializeYourStrategyTechnicalContract(
      createYourStrategyDraft(),
    );

    expect(result.activationBlockers).toEqual([]);
    expect(result.technicalContract?.name).toBe("YOUR Strategy");
    expect(result.technicalContract?.symbol).toBe("BTC/USDC");
    expect(result.technicalContract?.timeframe).toBe("5m");
    expect(result.technicalContract?.risk.takeProfit).toEqual({
      mode: "rr",
      multiple: 2,
    });
    expect(result.technicalContract?.execution.positionSize).toEqual({
      type: "fixedPercent",
      value: 5,
    });
  });

  it("expõe blockers quando o draft ainda não pode ser ativado", () => {
    const result = materializeYourStrategyTechnicalContract(
      createYourStrategyDraft({
        risk: {
          stopLoss: {
            mode: "static",
            unit: "percent",
            value: 3,
          },
          takeProfit: null,
        },
      }),
    );

    expect(result.activationBlockers).toEqual(["take_profit_missing"]);
    expect(result.technicalContract).toBeNull();
  });
});
