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
  synchronizePacificaAccountState?: (input: {
    walletAddress: string;
  }) => Promise<void>;
  now?: () => Date;
  degradedAfterMs?: number;
  errorAfterMs?: number;
};

/**
 * Returns the operational session snapshot for a wallet.
 *
 * Responsibility:
 * - optionally run the minimal runtime reconciliation step first
 * - read the persisted session snapshot after reconciliation
 * - refresh the visible product snapshot from Pacifica when available
 * - report whether an operational account exists for the wallet
 *
 * Non-responsibility:
 * - it does not implement Pacifica REST parsing itself
 * - it does not turn a Pacifica outage into a hard product outage
 */
export function createGetOperationalSessionByWallet(
  dependencies: GetOperationalSessionByWalletDependencies,
) {
  const getNow = dependencies.now ?? (() => new Date());
  const degradedAfterMs = dependencies.degradedAfterMs ?? 2 * 60 * 1000;
  const errorAfterMs = dependencies.errorAfterMs ?? 5 * 60 * 1000;

  /**
   * Reads the current session snapshot for a wallet.
   *
   * If runtime maintenance is available, the snapshot is preceded by a
   * lightweight internal reconciliation so the returned session already
   * reflects stale-heartbeat degradation, preset/runtime congruence fixes,
   * and basic runtime recovery after missing persisted state.
   */
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

    let session =
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

    if (dependencies.synchronizePacificaAccountState) {
      await dependencies.synchronizePacificaAccountState({
        walletAddress: input.walletAddress,
      });
      session =
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
    }

    return {
      ok: true,
      accountExists: true,
      session,
    };
  };
}
