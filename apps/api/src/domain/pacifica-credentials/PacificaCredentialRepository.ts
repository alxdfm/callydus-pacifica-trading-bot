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

export interface PacificaCredentialRepository {
  findActiveCredential(
    input: FindActiveCredentialInput,
  ): Promise<PacificaCredential | null>;
  findById(credentialId: string): Promise<PacificaCredential | null>;
  save(credential: SavePacificaCredentialInput): Promise<PacificaCredential>;
  updateOperationalVerification(
    input: UpdateOperationalVerificationInput,
  ): Promise<PacificaCredential>;
}
