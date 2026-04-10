import { afterEach, describe, expect, it, vi } from "vitest";
import { PacificaAccountStateGateway } from "./PacificaAccountStateGateway";

describe("PacificaAccountStateGateway", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("normaliza saldo da conta a partir do payload real da Pacifica", async () => {
    const fetchMock = vi.fn().mockImplementation((input: string | URL) => {
      const url = input.toString();

      if (url.includes("/api/v1/account")) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              data: {
                balance: "100.25",
                account_equity: "103.75",
                available_to_spend: "80.50",
                total_margin_used: "19.75",
              },
            }),
          ),
        );
      }

      return Promise.resolve(
        new Response(
          JSON.stringify({
            data: [],
          }),
        ),
      );
    });

    vi.stubGlobal("fetch", fetchMock);

    const gateway = new PacificaAccountStateGateway({
      pacificaRestBaseUrl: "https://pacifica.example",
    });

    const snapshot = await gateway.readAccountState({
      walletAddress: "wallet-1",
      nowIso: "2026-04-06T12:00:00.000Z",
    });

    expect(snapshot.balance).toEqual({
      totalBalance: 103.75,
      availableBalance: 80.5,
      aggregatedPnl: 3.5,
      capitalInUse: 19.75,
      capturedAtIso: "2026-04-06T12:00:00.000Z",
    });
  });

  it("normaliza side ask/bid das posicoes da Pacifica corretamente", async () => {
    const fetchMock = vi.fn().mockImplementation((input: string | URL) => {
      const url = input.toString();

      if (url.includes("/api/v1/positions")) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              data: [
                {
                  symbol: "SOL",
                  side: "ask",
                  amount: "0.14",
                  entry_price: "85.04",
                },
                {
                  symbol: "BTC",
                  side: "bid",
                  amount: "0.001",
                  entry_price: "90000",
                },
              ],
            }),
          ),
        );
      }

      return Promise.resolve(
        new Response(
          JSON.stringify({
            data: [],
          }),
        ),
      );
    });

    vi.stubGlobal("fetch", fetchMock);

    const gateway = new PacificaAccountStateGateway({
      pacificaRestBaseUrl: "https://pacifica.example",
    });

    const snapshot = await gateway.readAccountState({
      walletAddress: "wallet-1",
      nowIso: "2026-04-06T12:00:00.000Z",
    });

    expect(snapshot.positions).toEqual([
      {
        symbol: "SOL",
        side: "short",
        quantity: 0.14,
        entryPrice: 85.04,
        currentPrice: 85.04,
        unrealizedPnl: 0,
        pacificaTradeId: "position:SOL:short",
        isPlatformTrade: false,
      },
      {
        symbol: "BTC",
        side: "long",
        quantity: 0.001,
        entryPrice: 90000,
        currentPrice: 90000,
        unrealizedPnl: 0,
        pacificaTradeId: "position:BTC:long",
        isPlatformTrade: false,
      },
    ]);
  });
});
