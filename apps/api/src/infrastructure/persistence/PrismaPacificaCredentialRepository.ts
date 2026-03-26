import { PrismaClient } from "@prisma/client";
import type { PacificaCredential } from "../../domain/pacifica-credentials/PacificaCredential";
import type {
  FindActiveCredentialInput,
  PacificaCredentialRepository,
  SavePacificaCredentialInput,
} from "../../domain/pacifica-credentials/PacificaCredentialRepository";

export class PrismaPacificaCredentialRepository
  implements PacificaCredentialRepository
{
  constructor(private readonly prisma: PrismaClient) {}

  async findActiveCredential(
    input: FindActiveCredentialInput,
  ): Promise<PacificaCredential | null> {
    const credential = await this.prisma.pacificaCredential.findFirst({
      where: {
        operatorAccount: {
          walletAddress: input.walletAddress,
        },
        publicKey: input.publicKey,
        keyFingerprint: input.keyFingerprint,
        validationStatus: "valid",
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return credential ? mapCredential(credential) : null;
  }

  async save(input: SavePacificaCredentialInput): Promise<PacificaCredential> {
    const operatorAccount = await this.prisma.operatorAccount.upsert({
      where: {
        walletAddress: input.walletAddress,
      },
      update: {
        onboardingStatus: "credentials_validating",
      },
      create: {
        walletAddress: input.walletAddress,
        onboardingStatus: "credentials_validating",
      },
    });

    const credential = await this.prisma.pacificaCredential.create({
      data: {
        id: input.id,
        operatorAccountId: operatorAccount.id,
        credentialAlias: null,
        publicKey: input.publicKey,
        encryptedPrivateKeyRef: input.encryptedPrivateKeyRef,
        keyFingerprint: input.keyFingerprint,
        validationStatus: input.validationStatus,
        lastValidatedAt: input.lastValidatedAt
          ? new Date(input.lastValidatedAt)
          : null,
        lastValidationErrorCode: input.lastValidationErrorCode,
      },
    });

    await this.prisma.operatorAccount.update({
      where: {
        id: operatorAccount.id,
      },
      data: {
        onboardingStatus: "ready",
      },
    });

    return mapCredential(credential);
  }
}

function mapCredential(
  credential: {
    id: string;
    operatorAccountId: string;
    publicKey: string;
    encryptedPrivateKeyRef: string;
    keyFingerprint: string;
    validationStatus: "pending" | "validating" | "valid" | "invalid" | "error";
    lastValidatedAt: Date | null;
    lastValidationErrorCode: string | null;
  },
): PacificaCredential {
  return {
    id: credential.id,
    operatorAccountId: credential.operatorAccountId,
    publicKey: credential.publicKey,
    encryptedPrivateKeyRef: credential.encryptedPrivateKeyRef,
    keyFingerprint: credential.keyFingerprint,
    validationStatus: credential.validationStatus,
    lastValidatedAt: credential.lastValidatedAt?.toISOString() ?? null,
    lastValidationErrorCode: credential.lastValidationErrorCode,
  };
}
