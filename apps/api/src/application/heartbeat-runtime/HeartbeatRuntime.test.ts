import { describe, expect, it, vi } from "vitest";
import { createHeartbeatRuntime } from "./HeartbeatRuntime";

describe("createHeartbeatRuntime", () => {
  it("bloqueia heartbeat sem wallet conectada", async () => {
    const heartbeatRuntime = createHeartbeatRuntime({
      runtimeMaintenanceRepository: {
        heartbeatRuntime: vi.fn(),
      } as never,
    });

    await expect(
      heartbeatRuntime({
        walletAddress: " ",
        botStatus: "active",
        syncStatus: "healthy",
        pacificaConnectionStatus: "connected",
      }),
    ).resolves.toEqual({
      status: "error",
      walletAddress: " ",
      code: "account_not_ready",
      message: "Could not resolve an operational account for this wallet.",
      retryable: false,
    });
  });

  it("persiste heartbeat com timestamp do backend", async () => {
    const repository = {
      heartbeatRuntime: vi.fn().mockResolvedValue({
        botStatus: "active",
        pacificaConnectionStatus: "connected",
        syncStatus: "healthy",
        exchangeSnapshotStatus: "confirmed",
        exchangeLastSyncedAt: null,
        exchangeSnapshotMessage: null,
        activePresetActivationId: null,
        lastHeartbeatAt: "2026-04-01T00:00:00.000Z",
        lastErrorMessage: null,
      }),
    };
    const heartbeatRuntime = createHeartbeatRuntime({
      runtimeMaintenanceRepository: repository as never,
      now: () => new Date("2026-04-01T00:00:00.000Z"),
    });

    const result = await heartbeatRuntime({
      walletAddress: "wallet-1",
      botStatus: "active",
      syncStatus: "healthy",
      pacificaConnectionStatus: "connected",
      lastErrorMessage: null,
    });

    expect(result.status).toBe("success");
    expect(repository.heartbeatRuntime).toHaveBeenCalledWith({
      walletAddress: "wallet-1",
      botStatus: "active",
      syncStatus: "healthy",
      pacificaConnectionStatus: "connected",
      lastErrorMessage: null,
      nowIso: "2026-04-01T00:00:00.000Z",
    });
  });
});
