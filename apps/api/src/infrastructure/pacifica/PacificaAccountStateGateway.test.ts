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

      if (url.includes("/api/v1/portfolio")) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              success: true,
              data: [
                { account_equity: "103.00", pnl: "-1.50", timestamp: 1000 },
                { account_equity: "102.50", pnl: "-2.00", timestamp: 2000 },
                { account_equity: "103.75", pnl: "-0.75", timestamp: 3000 },
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

    expect(snapshot.balance).toEqual({
      totalBalance: 103.75,
      availableBalance: 80.5,
      aggregatedPnl: -0.75,
      capitalInUse: 19.75,
      capturedAtIso: "2026-04-06T12:00:00.000Z",
    });
  });

  it("usa o pnl da ultima entrada do portfolio como aggregatedPnl (7d cumulativo)", async () => {
    const fetchMock = vi.fn().mockImplementation((input: string | URL) => {
      const url = input.toString();

      if (url.includes("/api/v1/account")) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              data: {
                accountEquity: "210.50",
                walletBalance: "200.00",
                freeCollateral: "150.25",
                totalMarginUsed: "60.25",
              },
            }),
          ),
        );
      }

      if (url.includes("/api/v1/portfolio")) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              success: true,
              data: [
                { account_equity: "211.00", pnl: "-0.50", timestamp: 1000 },
                { account_equity: "210.50", pnl: "-0.93", timestamp: 2000 },
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

    expect(snapshot.balance).toEqual({
      totalBalance: 210.5,
      availableBalance: 150.25,
      aggregatedPnl: -0.93,
      capitalInUse: 60.25,
      capturedAtIso: "2026-04-06T12:00:00.000Z",
    });
  });

  it("retorna balance null quando portfolio nao retorna dados de pnl", async () => {
    const fetchMock = vi.fn().mockImplementation((input: string | URL) => {
      const url = input.toString();

      if (url.includes("/api/v1/account")) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              data: {
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

    expect(snapshot.balance).toBeNull();
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
                  unrealizedPnl: "-1.25",
                  markPrice: "83.79",
                },
                {
                  symbol: "BTC",
                  side: "bid",
                  amount: "0.001",
                  entry_price: "90000",
                  pnl: "0.75",
                  currentPrice: "90750",
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
        currentPrice: 83.79,
        unrealizedPnl: -1.25,
        pacificaTradeId: "position:SOL:short",
        isPlatformTrade: false,
      },
      {
        symbol: "BTC",
        side: "long",
        quantity: 0.001,
        entryPrice: 90000,
        currentPrice: 90750,
        unrealizedPnl: 0.75,
        pacificaTradeId: "position:BTC:long",
        isPlatformTrade: false,
      },
    ]);
  });
});
