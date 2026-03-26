export type PacificaBuilderApprovalErrorCode =
  | "wallet_not_connected"
  | "wallet_signature_unavailable"
  | "wallet_signature_rejected"
  | "builder_approval_rejected"
  | "provider_unavailable"
  | "rate_limited"
  | "internal_error";

export type PacificaBuilderApprovalResult =
  | {
      ok: true;
      approvedAt: string;
    }
  | {
      ok: false;
      errorCode: PacificaBuilderApprovalErrorCode;
    };

export interface PacificaBuilderApprovalPort {
  approveBuilderCode(input: {
    mainWalletPublicKey: string;
    builderCode: string;
    maxFeeRate: string;
    timestamp: number;
    expiryWindow: number;
    signature: string;
  }): Promise<PacificaBuilderApprovalResult>;
}
