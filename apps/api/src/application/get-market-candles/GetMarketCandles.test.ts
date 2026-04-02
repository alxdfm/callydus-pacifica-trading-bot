import { describe, expect, it, vi } from "vitest";
import { PacificaApiError } from "../../infrastructure/pacifica/PacificaClient";
import { createGetMarketCandles } from "./GetMarketCandles";

describe("createGetMarketCandles", () => {
  it("encaminha candles normalizados para o contrato de leitura", async () => {
    const getMarketCandles = createGetMarketCandles({
      marketData: {
        getCandles: vi.fn().mockResolvedValue([
          {
            symbol: "BTC",
            interval: "1m",
            openTime: 0,
            closeTime: 60_000,
            open: 100,
            high: 101,
            low: 99,
            close: 100,
            volume: 10,
          },
        ]),
      } as never,
    });

    const result = await getMarketCandles({
      symbol: "BTC",
      interval: "1m",
      priceSource: "market",
      startTime: 0,
    });

    expect(result.status).toBe("success");
    if (result.status === "success") {
      expect(result.symbol).toBe("BTC");
      expect(result.candles).toHaveLength(1);
    }
  });

  it("traduz erro não retryable da Pacifica como internal_error", async () => {
    const getMarketCandles = createGetMarketCandles({
      marketData: {
        getCandles: vi.fn().mockRejectedValue(
          new PacificaApiError("boom", {
            status: 400,
            body: { raw: "bad request" },
            retryable: false,
          }),
        ),
      } as never,
    });

    await expect(
      getMarketCandles({
        symbol: "BTC",
        interval: "1m",
        priceSource: "market",
        startTime: 0,
      }),
    ).resolves.toEqual({
      status: "error",
      code: "internal_error",
      message: "bad request",
      retryable: false,
    });
  });
});
