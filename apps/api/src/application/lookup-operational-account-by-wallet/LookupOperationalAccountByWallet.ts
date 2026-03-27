import type { PacificaCredentialRepository } from "../../domain/pacifica-credentials/PacificaCredentialRepository";

export type LookupOperationalAccountByWalletInput = {
  walletAddress: string;
};

export type LookupOperationalAccountByWalletOutput =
  | {
      ok: true;
      accountExists: true;
      walletAddress: string;
      onboardingStatus:
        | "wallet_pending"
        | "credentials_pending"
        | "credentials_validating"
        | "ready"
        | "blocked";
      credentialId: string | null;
      credentialAlias: string | null;
      agentWalletPublicKey: string | null;
      keyFingerprint: string | null;
      operationallyVerified: boolean;
    }
  | {
      ok: true;
      accountExists: false;
      walletAddress: string;
    };

export type LookupOperationalAccountByWalletDependencies = {
  credentialRepository: PacificaCredentialRepository;
};

export function createLookupOperationalAccountByWallet(
  dependencies: LookupOperationalAccountByWalletDependencies,
) {
  return async function lookupOperationalAccountByWallet(
    input: LookupOperationalAccountByWalletInput,
  ): Promise<LookupOperationalAccountByWalletOutput> {
    const account =
      await dependencies.credentialRepository.findOperationalAccountByWalletAddress(
        input.walletAddress,
      );

    if (!account) {
      return {
        ok: true,
        accountExists: false,
        walletAddress: input.walletAddress,
      };
    }

    return {
      ok: true,
      accountExists: true,
      walletAddress: account.walletAddress,
      onboardingStatus: account.onboardingStatus as
        | "wallet_pending"
        | "credentials_pending"
        | "credentials_validating"
        | "ready"
        | "blocked",
      credentialId: account.credentialId,
      credentialAlias: account.credentialAlias,
      agentWalletPublicKey: account.agentWalletPublicKey,
      keyFingerprint: account.keyFingerprint,
      operationallyVerified: account.operationallyVerified,
    };
  };
}
