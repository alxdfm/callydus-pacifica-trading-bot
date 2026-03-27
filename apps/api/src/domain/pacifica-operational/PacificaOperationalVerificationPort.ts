export type PacificaOperationalVerificationErrorCode =
  | "probe_market_config_invalid"
  | "signature_rejected"
  | "agent_wallet_unauthorized_for_account"
  | "account_blocked"
  | "provider_unavailable"
  | "rate_limited"
  | "internal_error";

export type PacificaOperationalVerificationResult =
  | {
      ok: true;
      verifiedAt: string;
      probeSymbol: string;
      probeClientOrderId: string;
      probePayload: unknown;
    }
  | {
      ok: false;
      errorCode: PacificaOperationalVerificationErrorCode;
      probePayload: unknown | null;
    };

export interface PacificaOperationalVerificationPort {
  verifyOperationalReadiness(input: {
    mainWalletPublicKey: string;
    agentWalletPublicKey: string;
    agentWalletPrivateKey: string;
  }): Promise<PacificaOperationalVerificationResult>;
}
