import { describe, expect, it } from "vitest";
import {
  buildLeaseExpiryIso,
  calculateTargetNotionalUsd,
  calculateUnrealizedPnl,
  deriveProtectionFromActualEntry,
  extractPacificaErrorMessage,
  formatProtectedPrice,
  resolveAutomaticClose,
  shouldEvaluateSignals,
} from "./createOperationalWorker";

describe("createOperationalWorker pure rules", () => {
  it("respeita a cadência mínima de análise por conta", () => {
    expect(
      shouldEvaluateSignals(
        "2026-04-01T10:00:00.000Z",
        new Date("2026-04-01T10:00:30.000Z"),
        60_000,
      ),
    ).toBe(false);
    expect(
      shouldEvaluateSignals(
        "2026-04-01T10:00:00.000Z",
        new Date("2026-04-01T10:01:00.000Z"),
        60_000,
      ),
    ).toBe(true);
  });

  it("calcula o vencimento da lease a partir do instante de referência", () => {
    expect(
      buildLeaseExpiryIso(new Date("2026-04-01T10:00:00.000Z"), 45_000),
    ).toBe("2026-04-01T10:00:45.000Z");
  });

  it("deriva o notional alvo conforme o tipo de posição configurado", () => {
    expect(
      calculateTargetNotionalUsd({
        latestBalanceSnapshot: {
          availableBalance: 200,
        },
        positionSizeType: "balance_percent",
        positionSizeValue: 5,
        leverage: 10,
      }),
    ).toBe(100);
    expect(
      calculateTargetNotionalUsd({
        latestBalanceSnapshot: null,
        positionSizeType: "fixed_amount",
        positionSizeValue: 25,
        leverage: 20,
      }),
    ).toBe(25);
  });

  it("calcula unrealized PnL com sinal correto para long e short", () => {
    expect(
      calculateUnrealizedPnl({
        side: "long",
        entryPrice: 100,
        currentPrice: 110,
        quantity: 2,
      }),
    ).toBe(20);
    expect(
      calculateUnrealizedPnl({
        side: "short",
        entryPrice: 100,
        currentPrice: 90,
        quantity: 2,
      }),
    ).toBe(20);
  });

  it("fecha trade automaticamente por stop loss ou take profit usando a vela atual", () => {
    expect(
      resolveAutomaticClose({
        side: "long",
        stopLossPrice: 95,
        takeProfitPrice: 110,
        candleHigh: 108,
        candleLow: 94,
      }),
    ).toEqual({
      closeReason: "stop_loss",
      exitPrice: 95,
    });
    expect(
      resolveAutomaticClose({
        side: "short",
        stopLossPrice: 105,
        takeProfitPrice: 90,
        candleHigh: 101,
        candleLow: 89,
      }),
    ).toEqual({
      closeReason: "take_profit",
      exitPrice: 90,
    });
  });

  it("protege preços conforme a granularidade de tick size", () => {
    expect(formatProtectedPrice(123.4567, "0.01")).toBe("123.46");
    expect(formatProtectedPrice(123.4567, "1")).toBe("123");
  });

  it("recalcula a proteção usando o entry real sem inverter a direção", () => {
    const longProtection = deriveProtectionFromActualEntry({
      side: "long",
      actualEntryPrice: 84.77,
      plannedEntryPrice: 84.35,
      plannedStopLossPrice: 84.24,
      plannedTakeProfitPrice: 84.57,
    });

    expect(longProtection.entryPrice).toBeCloseTo(84.77);
    expect(longProtection.stopLossPrice).toBeCloseTo(84.66);
    expect(longProtection.takeProfitPrice).toBeCloseTo(84.99);

    const shortProtection = deriveProtectionFromActualEntry({
      side: "short",
      actualEntryPrice: 84.01,
      plannedEntryPrice: 83.85,
      plannedStopLossPrice: 83.98,
      plannedTakeProfitPrice: 83.58,
    });

    expect(shortProtection.entryPrice).toBeCloseTo(84.01);
    expect(shortProtection.stopLossPrice).toBeCloseTo(84.14);
    expect(shortProtection.takeProfitPrice).toBeCloseTo(83.74);
  });

  it("extrai a mensagem mais útil do payload Pacifica com fallback estável", () => {
    expect(extractPacificaErrorMessage({ error: "api message" }, "fallback")).toBe(
      "api message",
    );
    expect(extractPacificaErrorMessage({ raw: "raw message" }, "fallback")).toBe(
      "raw message",
    );
    expect(extractPacificaErrorMessage({}, "fallback")).toBe("fallback");
  });
});
