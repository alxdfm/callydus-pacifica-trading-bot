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

export interface PacificaCredentialRepository {
  findActiveCredential(
    input: FindActiveCredentialInput,
  ): Promise<PacificaCredential | null>;
  save(credential: SavePacificaCredentialInput): Promise<PacificaCredential>;
}
