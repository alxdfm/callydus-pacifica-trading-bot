import { describe, expect, it, vi } from "vitest";
import { createReconcileRuntime } from "./ReconcileRuntime";

describe("createReconcileRuntime", () => {
  it("bloqueia reconciliação sem wallet conectada", async () => {
    const reconcileRuntime = createReconcileRuntime({
      runtimeMaintenanceRepository: {
        reconcileRuntime: vi.fn(),
      } as never,
    });

    await expect(reconcileRuntime({ walletAddress: " " })).resolves.toEqual({
      status: "error",
      walletAddress: " ",
      code: "account_not_ready",
      message: "Could not resolve an operational account for this wallet.",
      retryable: false,
    });
  });

  it("propaga os thresholds de degradação e erro para o maintenance layer", async () => {
    const repository = {
      reconcileRuntime: vi.fn().mockResolvedValue({
        runtime: {
          botStatus: "active",
          pacificaConnectionStatus: "connected",
          syncStatus: "healthy",
          exchangeSnapshotStatus: "confirmed",
          exchangeLastSyncedAt: null,
          exchangeSnapshotMessage: null,
          activePresetActivationId: null,
          lastHeartbeatAt: null,
          lastErrorMessage: null,
        },
        recoveredRuntimeState: false,
        detectedDivergence: false,
        alertMessage: null,
      }),
    };
    const reconcileRuntime = createReconcileRuntime({
      runtimeMaintenanceRepository: repository as never,
      now: () => new Date("2026-04-01T00:00:00.000Z"),
      degradedAfterMs: 1_000,
      errorAfterMs: 5_000,
    });

    const result = await reconcileRuntime({ walletAddress: "wallet-1" });

    expect(result.status).toBe("success");
    expect(repository.reconcileRuntime).toHaveBeenCalledWith({
      walletAddress: "wallet-1",
      nowIso: "2026-04-01T00:00:00.000Z",
      degradedAfterMs: 1_000,
      errorAfterMs: 5_000,
    });
  });
});
