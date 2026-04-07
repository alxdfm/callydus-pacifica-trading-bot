import type { SymbolOperationalConfig } from "@pacifica/contracts";
import type { OnboardingStatus } from "@pacifica/contracts";
import type { PacificaCredential } from "./PacificaCredential";

export type FindActiveCredentialInput = {
  walletAddress: string;
  publicKey: string;
  keyFingerprint: string;
};

export type SavePacificaCredentialInput = Omit<
  PacificaCredential,
  "operatorAccountId"
> & {
  walletAddress: string;
};

export type UpdateOperationalVerificationInput = {
  credentialId: string;
  operationallyVerified: boolean;
  lastOperationalVerifiedAt: string | null;
  lastOperationalErrorCode: string | null;
  lastOperationalProbeJson: unknown | null;
};

export type OperationalAccountLookup = {
  walletAddress: string;
  onboardingStatus: OnboardingStatus;
  credentialId: string | null;
  credentialAlias: string | null;
  agentWalletPublicKey: string | null;
  keyFingerprint: string | null;
  operationallyVerified: boolean;
};

export interface PacificaCredentialRepository {
  findActiveCredential(
    input: FindActiveCredentialInput,
  ): Promise<PacificaCredential | null>;
  findLatestCredentialByWalletAndPublicKey(input: {
    walletAddress: string;
    publicKey: string;
  }): Promise<PacificaCredential | null>;
  findOperationalAccountByWalletAddress(
    walletAddress: string,
  ): Promise<OperationalAccountLookup | null>;
  findById(credentialId: string): Promise<PacificaCredential | null>;
  save(credential: SavePacificaCredentialInput): Promise<PacificaCredential>;
  updateOperationalVerification(
    input: UpdateOperationalVerificationInput,
  ): Promise<PacificaCredential>;
  upsertSymbolOperationalConfig(input: {
    walletAddress: string;
    config: SymbolOperationalConfig;
  }): Promise<SymbolOperationalConfig | null>;
  replaceSymbolOperationalConfigs(input: {
    walletAddress: string;
    configs: SymbolOperationalConfig[];
  }): Promise<SymbolOperationalConfig[] | null>;
}
