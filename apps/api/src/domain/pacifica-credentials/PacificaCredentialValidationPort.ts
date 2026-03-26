export type PacificaCredentialValidationErrorCode =
  | "wallet_not_connected"
  | "invalid_agent_wallet_format"
  | "invalid_agent_wallet_secret"
  | "account_not_found"
  | "agent_wallet_mismatch"
  | "builder_approval_rejected"
  | "builder_fee_limit_too_low"
  | "validation_rejected"
  | "provider_unavailable"
  | "rate_limited"
  | "internal_error";

export type PacificaCredentialValidationResult =
  | {
      ok: true;
      validatedAt: string;
    }
  | {
      ok: false;
      errorCode: PacificaCredentialValidationErrorCode;
    };

export interface PacificaCredentialValidationPort {
  validateAgentWallet(input: {
    mainWalletPublicKey: string;
    agentWalletPublicKey: string;
    agentWalletPrivateKey: string;
  }): Promise<PacificaCredentialValidationResult>;
}
