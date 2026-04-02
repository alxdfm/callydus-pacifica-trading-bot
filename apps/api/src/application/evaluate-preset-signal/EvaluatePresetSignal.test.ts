import { describe, expect, it, vi } from "vitest";
import { PacificaApiError } from "@pacifica/pacifica-market-data";
import {
  SAFER_PRESET_DEFINITION_ID,
  type MarketCandle,
  type PresetSignalEvaluationRequest,
} from "@pacifica/contracts";
import { createEvaluatePresetSignal } from "./EvaluatePresetSignal";

function createRequest(
  overrides: Partial<PresetSignalEvaluationRequest> = {},
): PresetSignalEvaluationRequest {
  return {
    presetDefinitionId: SAFER_PRESET_DEFINITION_ID,
    editableConfig: {
      symbol: "BTC/USDC",
      positionSizeType: "balance_percent",
      positionSizeValue: 5,
      longEnabled: true,
      shortEnabled: true,
    },
    priceSource: "market",
    ...overrides,
  };
}

function createCandle(index: number, close: number): MarketCandle {
  return {
    symbol: "BTC",
    interval: "15m",
    openTime: index * 60_000,
    closeTime: index * 60_000 + 60_000,
    open: close - 1,
    high: close + 2,
    low: close - 2,
    close,
    volume: 100 + index,
  };
}

describe("createEvaluatePresetSignal", () => {
  it("rejeita símbolos não suportados pela borda Pacifica", async () => {
    const evaluateSignal = createEvaluatePresetSignal({
      marketData: {
        getCandles: vi.fn(),
      } as never,
    });

    const result = await evaluateSignal(
      createRequest({
        editableConfig: {
          ...createRequest().editableConfig,
          symbol: "BTC/USD",
        },
      }),
    );

    expect(result).toEqual({
      status: "error",
      code: "unsupported_symbol",
      message: "Unsupported preset symbol for Pacifica market data.",
      retryable: false,
    });
  });

  it("falha quando não há candles suficientes para avaliar o preset", async () => {
    const evaluateSignal = createEvaluatePresetSignal({
      marketData: {
        getCandles: vi.fn().mockResolvedValue([createCandle(1, 100)]),
      } as never,
    });

    const result = await evaluateSignal(createRequest());

    expect(result.status).toBe("error");
    if (result.status === "error") {
      expect(result.code).toBe("insufficient_market_data");
    }
  });

  it("retorna snapshot auditável com risco derivado quando há mercado suficiente", async () => {
    const candles = Array.from({ length: 120 }, (_, index) =>
      createCandle(index, 100 + Math.sin(index / 4) * 10 + index * 0.2),
    );
    const appendOperationalEvent = vi.fn();
    const evaluateSignal = createEvaluatePresetSignal({
      marketData: {
        getCandles: vi.fn().mockResolvedValue(candles),
      } as never,
      eventRepository: {
        appendOperationalEvent,
      } as never,
      now: () => new Date("2026-04-01T12:00:00.000Z"),
    });

    const result = await evaluateSignal(createRequest());

    expect(result.status).toBe("success");
    if (result.status === "success") {
      expect(result.marketSymbol).toBe("BTC");
      expect(result.candlesUsed).toBe(120);
      expect(result.entryReferencePrice).toBe(candles.at(-1)?.close);
      expect(result.longRiskPlan.riskDistance).toBeGreaterThan(0);
    }
    expect(appendOperationalEvent).toHaveBeenCalledTimes(1);
  });

  it("traduz falhas retryable do provider para provider_unavailable", async () => {
    const evaluateSignal = createEvaluatePresetSignal({
      marketData: {
        getCandles: vi.fn().mockRejectedValue(
          new PacificaApiError("provider exploded", {
            status: 503,
            body: { error: "temporarily unavailable" },
            retryable: true,
          }),
        ),
      } as never,
    });

    const result = await evaluateSignal(createRequest());

    expect(result).toEqual({
      status: "error",
      code: "provider_unavailable",
      message: "temporarily unavailable",
      retryable: true,
    });
  });
});
