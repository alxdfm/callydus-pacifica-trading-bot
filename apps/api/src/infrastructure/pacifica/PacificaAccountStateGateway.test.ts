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
});
