import { Prisma, PrismaClient } from "@prisma/client";
import type { PacificaCredential } from "../../domain/pacifica-credentials/PacificaCredential";
import type {
  FindActiveCredentialInput,
  OperationalAccountLookup,
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
        OR: [
          {
            walletAddress: input.walletAddress,
          },
          {
            operatorAccount: {
              walletAddress: input.walletAddress,
            },
          },
        ],
        publicKey: input.publicKey,
        keyFingerprint: input.keyFingerprint,
        validationStatus: "valid",
        lifecycleStatus: "active",
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

  async findLatestCredentialByWalletAndPublicKey(input: {
    walletAddress: string;
    publicKey: string;
  }): Promise<PacificaCredential | null> {
    const credential = await this.prisma.pacificaCredential.findFirst({
      where: {
        OR: [
          {
            walletAddress: input.walletAddress,
          },
          {
            operatorAccount: {
              walletAddress: input.walletAddress,
            },
          },
        ],
        publicKey: input.publicKey,
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
    const credential = await this.prisma.pacificaCredential.create({
      data: {
        id: input.id,
        operatorAccountId: null,
        walletAddress: input.walletAddress,
        credentialAlias: input.credentialAlias,
        publicKey: input.publicKey,
        encryptedPrivateKeyRef: input.encryptedPrivateKeyRef,
        keyFingerprint: input.keyFingerprint,
        validationStatus: input.validationStatus,
        lifecycleStatus: input.lifecycleStatus,
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

  async findOperationalAccountByWalletAddress(
    walletAddress: string,
  ): Promise<OperationalAccountLookup | null> {
    const operatorAccount = await this.prisma.operatorAccount.findUnique({
      where: {
        walletAddress,
      },
      include: {
        pacificaCredentials: {
          where: {
            validationStatus: "valid",
            lifecycleStatus: "active",
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
      },
    });

    if (!operatorAccount) {
      return null;
    }

    const latestCredential = operatorAccount.pacificaCredentials[0] ?? null;

    return {
      walletAddress: operatorAccount.walletAddress,
      onboardingStatus: operatorAccount.onboardingStatus,
      credentialId: latestCredential?.id ?? null,
      credentialAlias: latestCredential?.credentialAlias ?? null,
      agentWalletPublicKey: latestCredential?.publicKey ?? null,
      keyFingerprint: latestCredential?.keyFingerprint ?? null,
      operationallyVerified: latestCredential?.operationallyVerified ?? false,
    };
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
    const credential = await this.prisma.pacificaCredential.findUnique({
      where: {
        id: input.credentialId,
      },
      include: {
        operatorAccount: true,
      },
    });

    if (!credential) {
      throw new Error("PacificaCredential not found during operational update.");
    }

    if (!input.operationallyVerified) {
      const updatedCredential = await this.prisma.pacificaCredential.update({
        where: {
          id: input.credentialId,
        },
        data: {
          operationallyVerified: false,
          lastOperationalVerifiedAt: null,
          lastOperationalErrorCode: input.lastOperationalErrorCode,
          lastOperationalProbeJson: toPrismaJsonValue(
            input.lastOperationalProbeJson,
          ),
        },
        include: {
          operatorAccount: true,
        },
      });

      return mapCredential(updatedCredential);
    }

    const walletAddress =
      credential.walletAddress ?? credential.operatorAccount?.walletAddress;

    if (!walletAddress) {
      throw new Error(
        "PacificaCredential is missing walletAddress during operational promotion.",
      );
    }

    const attachedCredential = await this.prisma.$transaction(async (tx) => {
      const operatorAccount = await tx.operatorAccount.upsert({
        where: {
          walletAddress,
        },
        update: {
          onboardingStatus: "ready",
        },
        create: {
          walletAddress,
          onboardingStatus: "ready",
        },
      });

      await tx.pacificaCredential.updateMany({
        where: {
          id: {
            not: credential.id,
          },
          lifecycleStatus: "active",
          OR: [
            {
              walletAddress,
            },
            {
              operatorAccountId: operatorAccount.id,
            },
          ],
        },
        data: {
          lifecycleStatus: "replaced",
          operationallyVerified: false,
        },
      });

      return tx.pacificaCredential.update({
        where: {
          id: credential.id,
        },
        data: {
          operatorAccountId: operatorAccount.id,
          lifecycleStatus: "active",
          operationallyVerified: true,
          lastOperationalVerifiedAt: input.lastOperationalVerifiedAt
            ? new Date(input.lastOperationalVerifiedAt)
            : null,
          lastOperationalErrorCode: null,
          lastOperationalProbeJson: toPrismaJsonValue(
            input.lastOperationalProbeJson,
          ),
        },
        include: {
          operatorAccount: true,
        },
      });
    });

    return mapCredential(attachedCredential);
  }
}

function mapCredential(
  credential: Prisma.PacificaCredentialGetPayload<{
    include: {
      operatorAccount: true;
    };
  }>,
): PacificaCredential {
  const walletAddress =
    credential.walletAddress ?? credential.operatorAccount?.walletAddress ?? "";

  return {
    id: credential.id,
    operatorAccountId: credential.operatorAccountId,
    walletAddress,
    credentialAlias: credential.credentialAlias,
    publicKey: credential.publicKey,
    encryptedPrivateKeyRef: credential.encryptedPrivateKeyRef,
    keyFingerprint: credential.keyFingerprint,
    validationStatus: credential.validationStatus,
    lifecycleStatus: credential.lifecycleStatus,
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
