import type {
  RuntimeReconcileRequest,
  RuntimeReconcileResponse,
} from "@pacifica/contracts";
import type { RuntimeMaintenanceRepository } from "../../domain/runtime-maintenance/RuntimeMaintenanceRepository";

export type ReconcileRuntimeDependencies = {
  runtimeMaintenanceRepository: RuntimeMaintenanceRepository;
  now?: () => Date;
  degradedAfterMs?: number;
  errorAfterMs?: number;
};

export function createReconcileRuntime(
  dependencies: ReconcileRuntimeDependencies,
) {
  const getNow = dependencies.now ?? (() => new Date());
  const degradedAfterMs = dependencies.degradedAfterMs ?? 2 * 60 * 1000;
  const errorAfterMs = dependencies.errorAfterMs ?? 5 * 60 * 1000;

  return async function reconcileRuntime(
    input: RuntimeReconcileRequest,
  ): Promise<RuntimeReconcileResponse> {
    if (!input.walletAddress.trim()) {
      return {
        status: "error",
        walletAddress: input.walletAddress,
        code: "account_not_ready",
        message: "Could not resolve an operational account for this wallet.",
        retryable: false,
      };
    }

    const result = await dependencies.runtimeMaintenanceRepository.reconcileRuntime({
      walletAddress: input.walletAddress,
      nowIso: getNow().toISOString(),
      degradedAfterMs,
      errorAfterMs,
    });

    if (!result) {
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
      runtime: result.runtime,
      recoveredRuntimeState: result.recoveredRuntimeState,
      detectedDivergence: result.detectedDivergence,
      alertMessage: result.alertMessage,
      message: result.detectedDivergence
        ? "Runtime reconciliation detected and handled a divergence."
        : "Runtime reconciliation completed without divergence.",
    };
  };
}
