import { describe, expect, it, vi } from "vitest";
import { createCloseTrade } from "./CloseTrade";

describe("createCloseTrade", () => {
  it("bloqueia fechamento sem wallet conectada", async () => {
    const closeTrade = createCloseTrade({
      commandRepository: {
        closeTrade: vi.fn(),
      } as never,
    });

    await expect(
      closeTrade({ walletAddress: " ", tradeId: "trade-1" }),
    ).resolves.toEqual({
      status: "error",
      code: "wallet_not_connected",
      message: "Connect the main wallet before closing a trade.",
      retryable: false,
    });
  });

  it("retorna trade_not_found quando o comando não encontra a posição", async () => {
    const appendOperationalEvent = vi.fn();
    const closeTrade = createCloseTrade({
      commandRepository: {
        closeTrade: vi.fn().mockResolvedValue(null),
      } as never,
      eventRepository: {
        appendOperationalEvent,
      } as never,
      now: () => new Date("2026-04-01T10:00:00.000Z"),
    });

    const result = await closeTrade({
      walletAddress: "wallet-1",
      tradeId: "trade-1",
    });

    expect(result).toEqual({
      status: "error",
      code: "trade_not_found",
      message: "The selected trade could not be found for this account.",
      retryable: false,
    });
    expect(appendOperationalEvent).toHaveBeenCalledTimes(1);
  });
});
