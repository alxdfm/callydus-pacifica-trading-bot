import { describe, expect, it, vi } from "vitest";
import { PacificaApiError } from "../../infrastructure/pacifica/PacificaClient";
import { createGetMarketPrices } from "./GetMarketPrices";

describe("createGetMarketPrices", () => {
  it("retorna preços normalizados quando o provider responde", async () => {
    const getMarketPrices = createGetMarketPrices({
      marketData: {
        getPrices: vi.fn().mockResolvedValue([
          {
            symbol: "BTC",
            markPrice: 100,
            indexPrice: 100,
            lastPrice: 100,
            volume24h: 1000,
            openInterest: 10,
            fundingRate: 0.01,
            capturedAt: "2026-04-01T00:00:00.000Z",
          },
        ]),
      } as never,
    });

    const result = await getMarketPrices();

    expect(result.status).toBe("success");
    if (result.status === "success") {
      expect(result.prices).toHaveLength(1);
    }
  });

  it("traduz erro retryable da Pacifica como provider_unavailable", async () => {
    const getMarketPrices = createGetMarketPrices({
      marketData: {
        getPrices: vi.fn().mockRejectedValue(
          new PacificaApiError("boom", {
            status: 503,
            body: { error: "temporary" },
            retryable: true,
          }),
        ),
      } as never,
    });

    await expect(getMarketPrices()).resolves.toEqual({
      status: "error",
      code: "provider_unavailable",
      message: "temporary",
      retryable: true,
    });
  });
});
