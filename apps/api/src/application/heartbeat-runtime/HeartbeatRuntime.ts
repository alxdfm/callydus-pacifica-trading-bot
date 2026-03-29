import type {
  RuntimeHeartbeatRequest,
  RuntimeHeartbeatResponse,
} from "@pacifica/contracts";
import type { RuntimeMaintenanceRepository } from "../../domain/runtime-maintenance/RuntimeMaintenanceRepository";

export type HeartbeatRuntimeDependencies = {
  runtimeMaintenanceRepository: RuntimeMaintenanceRepository;
  now?: () => Date;
};

/**
 * Creates the runtime heartbeat command handler.
 *
 * Responsibility:
 * - validate the minimum command input
 * - persist the latest runtime liveness/status payload
 * - return the updated runtime snapshot
 *
 * Non-responsibility:
 * - it does not infer divergence by itself
 * - it does not query Pacifica
 */
export function createHeartbeatRuntime(
  dependencies: HeartbeatRuntimeDependencies,
) {
  const getNow = dependencies.now ?? (() => new Date());

  /**
   * Records a fresh runtime heartbeat for the wallet.
   *
   * This is the write-side signal that the worker/runtime is alive and that
   * the persisted runtime state can move back to a healthy or idle condition.
   */
  return async function heartbeatRuntime(
    input: RuntimeHeartbeatRequest,
  ): Promise<RuntimeHeartbeatResponse> {
    if (!input.walletAddress.trim()) {
      return {
        status: "error",
        walletAddress: input.walletAddress,
        code: "account_not_ready",
        message: "Could not resolve an operational account for this wallet.",
        retryable: false,
      };
    }

    const runtime = await dependencies.runtimeMaintenanceRepository.heartbeatRuntime({
      walletAddress: input.walletAddress,
      botStatus: input.botStatus,
      syncStatus: input.syncStatus,
      pacificaConnectionStatus: input.pacificaConnectionStatus,
      lastErrorMessage: input.lastErrorMessage ?? null,
      nowIso: getNow().toISOString(),
    });

    if (!runtime) {
      return {
        status: "error",
        walletAddress: input.walletAddress,
        code: "account_not_ready",
        message: "Could not resolve an operational account for this wallet.",
        retryable: false,
      };
    }

    return {
      status: "success",
      walletAddress: input.walletAddress,
      runtime,
      message: "Runtime heartbeat recorded successfully.",
    };
  };
}
