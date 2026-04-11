import type { RuntimeMaintenanceRepository } from "../../domain/runtime-maintenance/RuntimeMaintenanceRepository";

export type GetOperationalSessionSliceByWalletInput = {
  walletAddress: string;
};

export type GetOperationalSessionSliceByWalletOutput<TSession> =
  | {
      ok: true;
      accountExists: true;
      session: TSession;
    }
  | {
      ok: true;
      accountExists: false;
      walletAddress: string;
    };

type ExchangeRefreshState = {
  runtime: {
    exchangeSnapshotStatus: "confirmed" | "last_known";
    exchangeLastSyncedAt: string | null;
  };
};

export type GetOperationalSessionSliceByWalletDependencies<TSession> = {
  readSession: (walletAddress: string) => Promise<TSession | null>;
  runtimeMaintenanceRepository?: RuntimeMaintenanceRepository;
  synchronizePacificaAccountState?: (input: {
    walletAddress: string;
  }) => Promise<void>;
  synchronizePacificaSymbolOperationalConfigs?: (input: {
    walletAddress: string;
  }) => Promise<void>;
  refreshPacificaAccountState?: boolean;
  refreshSymbolOperationalConfigs?: boolean;
  now?: () => Date;
  degradedAfterMs?: number;
  errorAfterMs?: number;
  pacificaRefreshTtlMs?: number;
};

function hasExchangeRefreshState(value: unknown): value is ExchangeRefreshState {
  if (!value || typeof value !== "object") {
    return false;
  }

  const runtime =
    "runtime" in value && value.runtime && typeof value.runtime === "object"
      ? value.runtime
      : null;

  if (!runtime) {
    return false;
  }

  return (
    "exchangeSnapshotStatus" in runtime &&
    (runtime.exchangeSnapshotStatus === "confirmed" ||
      runtime.exchangeSnapshotStatus === "last_known") &&
    "exchangeLastSyncedAt" in runtime &&
    (typeof runtime.exchangeLastSyncedAt === "string" ||
      runtime.exchangeLastSyncedAt === null)
  );
}

export function createGetOperationalSessionSliceByWallet<TSession>(
  dependencies: GetOperationalSessionSliceByWalletDependencies<TSession>,
) {
  const getNow = dependencies.now ?? (() => new Date());
  const degradedAfterMs = dependencies.degradedAfterMs ?? 2 * 60 * 1000;
  const errorAfterMs = dependencies.errorAfterMs ?? 5 * 60 * 1000;
  const pacificaRefreshTtlMs = dependencies.pacificaRefreshTtlMs ?? 30 * 1000;

  return async function getOperationalSessionSliceByWallet(
    input: GetOperationalSessionSliceByWalletInput,
  ): Promise<GetOperationalSessionSliceByWalletOutput<TSession>> {
    if (dependencies.runtimeMaintenanceRepository) {
      await dependencies.runtimeMaintenanceRepository.reconcileRuntime({
        walletAddress: input.walletAddress,
        nowIso: getNow().toISOString(),
        degradedAfterMs,
        errorAfterMs,
      });
    }

    let session = (await dependencies.readSession(input.walletAddress)) as
      | TSession
      | null;

    if (!session) {
      return {
        ok: true,
        accountExists: false,
        walletAddress: input.walletAddress,
      };
    }

    const shouldRefreshPacificaSnapshot =
      dependencies.refreshPacificaAccountState === true &&
      dependencies.synchronizePacificaAccountState !== undefined &&
      (!hasExchangeRefreshState(session) ||
        !(
          session.runtime.exchangeSnapshotStatus === "confirmed" &&
          session.runtime.exchangeLastSyncedAt !== null &&
          getNow().getTime() -
            new Date(session.runtime.exchangeLastSyncedAt).getTime() <
            pacificaRefreshTtlMs
        ));

    if (shouldRefreshPacificaSnapshot && dependencies.synchronizePacificaAccountState) {
      await dependencies.synchronizePacificaAccountState({
        walletAddress: input.walletAddress,
      });
      session = await dependencies.readSession(input.walletAddress);

      if (!session) {
        return {
          ok: true,
          accountExists: false,
          walletAddress: input.walletAddress,
        };
      }
    }

    if (
      dependencies.refreshSymbolOperationalConfigs === true &&
      dependencies.synchronizePacificaSymbolOperationalConfigs
    ) {
      try {
        await dependencies.synchronizePacificaSymbolOperationalConfigs({
          walletAddress: input.walletAddress,
        });
        session = await dependencies.readSession(input.walletAddress);

        if (!session) {
          return {
            ok: true,
            accountExists: false,
            walletAddress: input.walletAddress,
          };
        }
      } catch {
        // Keep serving the last known snapshot when Pacifica settings are temporarily unavailable.
      }
    }

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
