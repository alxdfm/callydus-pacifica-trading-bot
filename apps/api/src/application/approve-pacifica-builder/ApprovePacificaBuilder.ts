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

export function createApprovePacificaBuilder(
  dependencies: ApprovePacificaBuilderDependencies,
) {
  return async function approvePacificaBuilder(
    input: ApprovePacificaBuilderInput,
  ): Promise<ApprovePacificaBuilderOutput> {
    if (!input.mainWalletPublicKey.trim()) {
      return { ok: false, errorCode: "wallet_not_connected" };
    }

    return dependencies.builderApproval.approveBuilderCode(input);
  };
}
