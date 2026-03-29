import type {
  PacificaBuilderApprovalErrorCode,
  PacificaBuilderApprovalPort,
} from "../../domain/pacifica-builder/PacificaBuilderApprovalPort";

export type ApprovePacificaBuilderInput = {
  mainWalletPublicKey: string;
  builderCode: string;
  maxFeeRate: string;
  timestamp: number;
  expiryWindow: number;
  signature: string;
};

export type ApprovePacificaBuilderOutput =
  | {
      ok: true;
      approvedAt: string;
    }
  | {
      ok: false;
      errorCode: PacificaBuilderApprovalErrorCode;
    };

export type ApprovePacificaBuilderDependencies = {
  builderApproval: PacificaBuilderApprovalPort;
};

/**
 * Creates the builder approval use case.
 *
 * Responsibility:
 * - validate minimum wallet presence
 * - forward the approval payload to the builder approval port
 */
export function createApprovePacificaBuilder(
  dependencies: ApprovePacificaBuilderDependencies,
) {
  /**
   * Approves the Pacifica builder code for the connected main wallet.
   */
  return async function approvePacificaBuilder(
    input: ApprovePacificaBuilderInput,
  ): Promise<ApprovePacificaBuilderOutput> {
    if (!input.mainWalletPublicKey.trim()) {
      return { ok: false, errorCode: "wallet_not_connected" };
    }

    return dependencies.builderApproval.approveBuilderCode(input);
  };
}
