import { Prisma, PrismaClient } from "@prisma/client";
import type { PacificaCredential } from "../../domain/pacifica-credentials/PacificaCredential";
import type {
  FindActiveCredentialInput,
  PacificaCredentialRepository,
  SavePacificaCredentialInput,
  UpdateOperationalVerificationInput,
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
      include: {
        operatorAccount: true,
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
        operationallyVerified: input.operationallyVerified,
        lastValidatedAt: input.lastValidatedAt
          ? new Date(input.lastValidatedAt)
          : null,
        lastValidationErrorCode: input.lastValidationErrorCode,
        lastOperationalVerifiedAt: input.lastOperationalVerifiedAt
          ? new Date(input.lastOperationalVerifiedAt)
          : null,
        lastOperationalErrorCode: input.lastOperationalErrorCode,
        lastOperationalProbeJson: toPrismaJsonValue(
          input.lastOperationalProbeJson,
        ),
      },
      include: {
        operatorAccount: true,
      },
    });

    return mapCredential(credential);
  }

  async findById(credentialId: string): Promise<PacificaCredential | null> {
    const credential = await this.prisma.pacificaCredential.findUnique({
      where: {
        id: credentialId,
      },
      include: {
        operatorAccount: true,
      },
    });

    return credential ? mapCredential(credential) : null;
  }

  async updateOperationalVerification(
    input: UpdateOperationalVerificationInput,
  ): Promise<PacificaCredential> {
    const credential = await this.prisma.pacificaCredential.update({
      where: {
        id: input.credentialId,
      },
      data: {
        operationallyVerified: input.operationallyVerified,
        lastOperationalVerifiedAt: input.lastOperationalVerifiedAt
          ? new Date(input.lastOperationalVerifiedAt)
          : null,
        lastOperationalErrorCode: input.lastOperationalErrorCode,
        lastOperationalProbeJson: toPrismaJsonValue(
          input.lastOperationalProbeJson,
        ),
      },
      include: {
        operatorAccount: true,
      },
    });

    await this.prisma.operatorAccount.update({
      where: {
        id: credential.operatorAccountId,
      },
      data: {
        onboardingStatus: input.operationallyVerified ? "ready" : "blocked",
      },
    });

    return mapCredential(credential);
  }
}

function mapCredential(
  credential: Prisma.PacificaCredentialGetPayload<{
    include: {
      operatorAccount: true;
    };
  }>,
): PacificaCredential {
  return {
    id: credential.id,
    operatorAccountId: credential.operatorAccountId,
    walletAddress: credential.operatorAccount.walletAddress,
    publicKey: credential.publicKey,
    encryptedPrivateKeyRef: credential.encryptedPrivateKeyRef,
    keyFingerprint: credential.keyFingerprint,
    validationStatus: credential.validationStatus,
    operationallyVerified: credential.operationallyVerified,
    lastValidatedAt: credential.lastValidatedAt?.toISOString() ?? null,
    lastValidationErrorCode: credential.lastValidationErrorCode,
    lastOperationalVerifiedAt:
      credential.lastOperationalVerifiedAt?.toISOString() ?? null,
    lastOperationalErrorCode: credential.lastOperationalErrorCode,
    lastOperationalProbeJson: credential.lastOperationalProbeJson,
  };
}

function toPrismaJsonValue(
  value: unknown,
): Prisma.NullableJsonNullValueInput | Prisma.InputJsonValue {
  if (value === null) {
    return Prisma.JsonNull;
  }

  return value as Prisma.InputJsonValue;
}
