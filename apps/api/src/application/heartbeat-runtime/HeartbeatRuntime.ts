import type {
  RuntimeHeartbeatRequest,
  RuntimeHeartbeatResponse,
} from "@pacifica/contracts";
import type { RuntimeMaintenanceRepository } from "../../domain/runtime-maintenance/RuntimeMaintenanceRepository";

export type HeartbeatRuntimeDependencies = {
  runtimeMaintenanceRepository: RuntimeMaintenanceRepository;
  now?: () => Date;
};

export function createHeartbeatRuntime(
  dependencies: HeartbeatRuntimeDependencies,
) {
  const getNow = dependencies.now ?? (() => new Date());

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
