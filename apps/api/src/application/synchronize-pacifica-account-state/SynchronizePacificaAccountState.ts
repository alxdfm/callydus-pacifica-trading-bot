import { PacificaApiError } from "@pacifica/pacifica-trading";
import type { PacificaAccountStatePort } from "../../domain/pacifica-account-state/PacificaAccountStatePort";
import type { RuntimeMaintenanceRepository } from "../../domain/runtime-maintenance/RuntimeMaintenanceRepository";

export type SynchronizePacificaAccountStateDependencies = {
  pacificaAccountState: PacificaAccountStatePort;
  runtimeMaintenanceRepository: RuntimeMaintenanceRepository;
  now?: () => Date;
};

/**
 * Synchronizes the locally persisted operational snapshot with the current
 * publicly visible state on Pacifica.
 */
export function createSynchronizePacificaAccountState(
  dependencies: SynchronizePacificaAccountStateDependencies,
) {
  const getNow = dependencies.now ?? (() => new Date());

  /**
   * Reads Pacifica state for a wallet and applies it to local runtime/read
   * models. When Pacifica is unavailable, the product keeps the last known
   * snapshot and marks that fallback explicitly.
   */
  return async function synchronizePacificaAccountState(input: {
    walletAddress: string;
  }) {
    const nowIso = getNow().toISOString();

    try {
      const snapshot = await dependencies.pacificaAccountState.readAccountState({
        walletAddress: input.walletAddress,
        nowIso,
      });
      await dependencies.runtimeMaintenanceRepository.applyPacificaExternalSnapshot(
        {
          walletAddress: input.walletAddress,
          snapshot,
          nowIso,
        },
      );
    } catch (error) {
      const message =
        error instanceof PacificaApiError
          ? extractPacificaErrorMessage(error.details.body, error.message)
          : error instanceof Error
            ? error.message
            : "Pacifica operational snapshot is temporarily unavailable.";

      await dependencies.runtimeMaintenanceRepository.markPacificaSnapshotUnavailable(
        {
          walletAddress: input.walletAddress,
          nowIso,
          message,
        },
      );
    }
  };
}

function extractPacificaErrorMessage(body: unknown, fallback: string) {
  if (body && typeof body === "object") {
    const messageCandidate =
      "msg" in body
        ? (body as { msg?: unknown }).msg
        : "message" in body
          ? (body as { message?: unknown }).message
          : "raw" in body
            ? (body as { raw?: unknown }).raw
            : null;

    if (typeof messageCandidate === "string" && messageCandidate.trim()) {
      return messageCandidate;
    }
  }

  return fallback;
}
