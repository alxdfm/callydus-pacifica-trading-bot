import type { PacificaExternalAccountSnapshot } from "../runtime-maintenance/RuntimeMaintenanceRepository";

export type ReadPacificaAccountStateInput = {
  walletAddress: string;
  nowIso: string;
};

/**
 * Port for reading the externally confirmed operational state from Pacifica.
 *
 * Responsibility:
 * - fetch balance, positions, orders and recent trade activity for an account
 * - normalize the exchange payload into one snapshot for reconciliation
 *
 * Non-responsibility:
 * - it does not persist any local state
 * - it does not decide how reconciliation mutates product read models
 */
export interface PacificaAccountStatePort {
  readAccountState(
    input: ReadPacificaAccountStateInput,
  ): Promise<PacificaExternalAccountSnapshot>;
}
