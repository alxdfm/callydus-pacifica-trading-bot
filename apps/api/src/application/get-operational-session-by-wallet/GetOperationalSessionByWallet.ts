import type { OperationalSessionRepository } from "../../domain/operational-session/OperationalSession";
import type { RuntimeMaintenanceRepository } from "../../domain/runtime-maintenance/RuntimeMaintenanceRepository";

export type GetOperationalSessionByWalletInput = {
  walletAddress: string;
};

export type GetOperationalSessionByWalletOutput =
  | {
      ok: true;
      accountExists: true;
      session: Awaited<
        ReturnType<OperationalSessionRepository["findByWalletAddress"]>
      > extends infer T
        ? Exclude<T, null>
        : never;
    }
  | {
      ok: true;
      accountExists: false;
      walletAddress: string;
    };

export type GetOperationalSessionByWalletDependencies = {
  operationalSessionRepository: OperationalSessionRepository;
  runtimeMaintenanceRepository?: RuntimeMaintenanceRepository;
  now?: () => Date;
  degradedAfterMs?: number;
  errorAfterMs?: number;
};

export function createGetOperationalSessionByWallet(
  dependencies: GetOperationalSessionByWalletDependencies,
) {
  const getNow = dependencies.now ?? (() => new Date());
  const degradedAfterMs = dependencies.degradedAfterMs ?? 2 * 60 * 1000;
  const errorAfterMs = dependencies.errorAfterMs ?? 5 * 60 * 1000;

  return async function getOperationalSessionByWallet(
    input: GetOperationalSessionByWalletInput,
  ): Promise<GetOperationalSessionByWalletOutput> {
    if (dependencies.runtimeMaintenanceRepository) {
      await dependencies.runtimeMaintenanceRepository.reconcileRuntime({
        walletAddress: input.walletAddress,
        nowIso: getNow().toISOString(),
        degradedAfterMs,
        errorAfterMs,
      });
    }

    const session =
      await dependencies.operationalSessionRepository.findByWalletAddress(
        input.walletAddress,
      );

    if (!session) {
      return {
        ok: true,
        accountExists: false,
        walletAddress: input.walletAddress,
      };
    }

    return {
      ok: true,
      accountExists: true,
      session,
    };
  };
}
