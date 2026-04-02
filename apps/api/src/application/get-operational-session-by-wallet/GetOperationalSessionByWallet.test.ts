import { describe, expect, it, vi } from "vitest";
import { createGetOperationalSessionByWallet } from "./GetOperationalSessionByWallet";

describe("createGetOperationalSessionByWallet", () => {
  it("retorna accountExists false quando a conta não existe", async () => {
    const getSession = createGetOperationalSessionByWallet({
      operationalSessionRepository: {
        findByWalletAddress: vi.fn().mockResolvedValue(null),
      } as never,
    });

    await expect(
      getSession({ walletAddress: "wallet-1" }),
    ).resolves.toEqual({
      ok: true,
      accountExists: false,
      walletAddress: "wallet-1",
    });
  });

  it("usa TTL para evitar refresh externo quando o snapshot confirmado ainda está fresco", async () => {
    const synchronizePacificaAccountState = vi.fn();
    const findByWalletAddress = vi.fn().mockResolvedValue({
      walletAddress: "wallet-1",
      runtime: {
        exchangeSnapshotStatus: "confirmed",
        exchangeLastSyncedAt: "2026-04-01T10:00:00.000Z",
      },
    });
    const getSession = createGetOperationalSessionByWallet({
      operationalSessionRepository: {
        findByWalletAddress,
      } as never,
      synchronizePacificaAccountState,
      now: () => new Date("2026-04-01T10:00:10.000Z"),
      pacificaRefreshTtlMs: 30_000,
    });

    const result = await getSession({ walletAddress: "wallet-1" });

    expect(result.ok).toBe(true);
    expect(synchronizePacificaAccountState).not.toHaveBeenCalled();
  });

  it("faz refresh externo quando o snapshot confirmado ficou velho", async () => {
    const synchronizePacificaAccountState = vi.fn().mockResolvedValue(undefined);
    const findByWalletAddress = vi
      .fn()
      .mockResolvedValueOnce({
        walletAddress: "wallet-1",
        runtime: {
          exchangeSnapshotStatus: "confirmed",
          exchangeLastSyncedAt: "2026-04-01T10:00:00.000Z",
        },
      })
      .mockResolvedValueOnce({
        walletAddress: "wallet-1",
        runtime: {
          exchangeSnapshotStatus: "confirmed",
          exchangeLastSyncedAt: "2026-04-01T10:01:00.000Z",
        },
      });
    const getSession = createGetOperationalSessionByWallet({
      operationalSessionRepository: {
        findByWalletAddress,
      } as never,
      synchronizePacificaAccountState,
      now: () => new Date("2026-04-01T10:01:00.000Z"),
      pacificaRefreshTtlMs: 30_000,
    });

    const result = await getSession({ walletAddress: "wallet-1" });

    expect(result.ok).toBe(true);
    expect(synchronizePacificaAccountState).toHaveBeenCalledWith({
      walletAddress: "wallet-1",
    });
    expect(findByWalletAddress).toHaveBeenCalledTimes(2);
  });
});
