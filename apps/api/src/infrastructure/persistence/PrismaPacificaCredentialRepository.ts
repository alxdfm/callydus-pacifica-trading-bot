import { Prisma, PrismaClient } from "@prisma/client";
import type { PacificaCredential } from "../../domain/pacifica-credentials/PacificaCredential";
import type {
  FindActiveCredentialInput,
  OperationalAccountLookup,
  PacificaCredentialRepository,
  SavePacificaCredentialInput,
  UpdateOperationalVerificationInput,
} from "../../domain/pacifica-credentials/PacificaCredentialRepository";
import type {
  OperationalSession,
  OperationalSessionRepository,
} from "../../domain/operational-session/OperationalSession";

export class PrismaPacificaCredentialRepository
  implements PacificaCredentialRepository, OperationalSessionRepository
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

  async findByWalletAddress(
    walletAddress: string,
  ): Promise<OperationalSession | null> {
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
        botRuntimeState: true,
        accountBalanceSnapshots: {
          orderBy: {
            capturedAt: "desc",
          },
          take: 1,
        },
        openTrades: {
          orderBy: {
            openedAt: "desc",
          },
        },
        closedTrades: {
          orderBy: {
            closedAt: "desc",
          },
        },
        operationalAlerts: {
          where: {
            isActive: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        presetActivations: {
          where: {
            activationStatus: "active",
          },
          orderBy: {
            updatedAt: "desc",
          },
          take: 1,
        },
      },
    });

    if (!operatorAccount) {
      return null;
    }

    const activeCredential = operatorAccount.pacificaCredentials[0] ?? null;
    const balanceSnapshot = operatorAccount.accountBalanceSnapshots[0] ?? null;
    const activePreset = operatorAccount.presetActivations[0] ?? null;
    const runtime = operatorAccount.botRuntimeState;
    const onboardingStatus = operatorAccount.onboardingStatus as
      | "wallet_pending"
      | "credentials_pending"
      | "credentials_validating"
      | "ready"
      | "blocked";
    const operationallyVerified = activeCredential?.operationallyVerified ?? false;
    const canAccessProduct =
      onboardingStatus === "ready" &&
      Boolean(activeCredential?.id) &&
      operationallyVerified;

    return {
      walletAddress: operatorAccount.walletAddress,
      onboardingStatus,
      credentialId: activeCredential?.id ?? null,
      agentWalletPublicKey: activeCredential?.publicKey ?? null,
      credentialAlias: activeCredential?.credentialAlias ?? null,
      keyFingerprint: activeCredential?.keyFingerprint ?? null,
      builderApproved: Boolean(activeCredential?.id),
      operationallyVerified,
      activePreset: activePreset ? mapPresetActivation(activePreset) : null,
      runtime: {
        balance: balanceSnapshot ? mapBalanceSnapshot(balanceSnapshot) : null,
        botStatus: runtime?.botStatus ?? "inactive",
        syncStatus: runtime?.syncStatus ?? "idle",
        pacificaConnectionStatus: runtime?.pacificaConnectionStatus ?? "disconnected",
        activePresetActivationId: runtime?.activePresetActivationId ?? null,
        lastHeartbeatAt: runtime?.lastHeartbeatAt?.toISOString() ?? null,
        lastErrorMessage: runtime?.lastErrorMessage ?? null,
        currentTrades: operatorAccount.openTrades.map(mapOpenTrade),
        closedTrades: operatorAccount.closedTrades.map(mapClosedTrade),
        activeAlerts: operatorAccount.operationalAlerts.map(mapOperationalAlert),
      },
      canAccessProduct,
    };
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

function decimalToNumber(value: Prisma.Decimal): number {
  return Number(value.toString());
}

function mapPresetActivation(
  activation: {
    id: string;
    operatorAccountId: string;
    presetDefinitionId: string;
    activationStatus: string;
    symbol: string;
    positionSizeType: "fixed_amount" | "balance_percent";
    positionSizeValue: Prisma.Decimal;
    longEnabled: boolean;
    shortEnabled: boolean;
    activatedAt: Date | null;
    deactivatedAt: Date | null;
  },
) {
  return {
    id: activation.id,
    operatorAccountId: activation.operatorAccountId,
    presetDefinitionId: activation.presetDefinitionId,
    activationStatus: activation.activationStatus as
      | "pending"
      | "active"
      | "paused"
      | "stopped"
      | "failed",
    editableConfig: {
      symbol: activation.symbol,
      positionSizeType: activation.positionSizeType,
      positionSizeValue: decimalToNumber(activation.positionSizeValue),
      longEnabled: activation.longEnabled,
      shortEnabled: activation.shortEnabled,
    },
    activatedAt: activation.activatedAt?.toISOString() ?? null,
    deactivatedAt: activation.deactivatedAt?.toISOString() ?? null,
  };
}

function mapBalanceSnapshot(snapshot: {
  totalBalance: Prisma.Decimal;
  availableBalance: Prisma.Decimal;
  aggregatedPnl: Prisma.Decimal;
  capitalInUse: Prisma.Decimal;
  capturedAt: Date;
}) {
  return {
    totalBalance: decimalToNumber(snapshot.totalBalance),
    availableBalance: decimalToNumber(snapshot.availableBalance),
    aggregatedPnl: decimalToNumber(snapshot.aggregatedPnl),
    capitalInUse: decimalToNumber(snapshot.capitalInUse),
    capturedAt: snapshot.capturedAt.toISOString(),
  };
}

function mapOpenTrade(trade: {
  id: string;
  pacificaTradeId: string;
  presetActivationId: string | null;
  symbol: string;
  side: "long" | "short";
  entryPrice: Prisma.Decimal;
  currentPrice: Prisma.Decimal;
  quantity: Prisma.Decimal;
  capitalAllocated: Prisma.Decimal;
  unrealizedPnl: Prisma.Decimal;
  tradeStatus: "open" | "close_requested" | "closing" | "sync_error";
  openedAt: Date;
  isPlatformTrade: boolean;
}) {
  return {
    id: trade.id,
    pacificaTradeId: trade.pacificaTradeId,
    presetActivationId: trade.presetActivationId,
    symbol: trade.symbol,
    side: trade.side,
    entryPrice: decimalToNumber(trade.entryPrice),
    currentPrice: decimalToNumber(trade.currentPrice),
    quantity: decimalToNumber(trade.quantity),
    capitalAllocated: decimalToNumber(trade.capitalAllocated),
    unrealizedPnl: decimalToNumber(trade.unrealizedPnl),
    tradeStatus: trade.tradeStatus,
    openedAt: trade.openedAt.toISOString(),
    isPlatformTrade: trade.isPlatformTrade,
  };
}

function mapClosedTrade(trade: {
  id: string;
  pacificaTradeId: string;
  presetActivationId: string | null;
  symbol: string;
  side: "long" | "short";
  entryPrice: Prisma.Decimal;
  exitPrice: Prisma.Decimal;
  quantity: Prisma.Decimal;
  capitalAllocated: Prisma.Decimal;
  realizedPnl: Prisma.Decimal;
  closeReason: "take_profit" | "stop_loss" | "manual" | "system" | "error";
  openedAt: Date;
  closedAt: Date;
  isPlatformTrade: boolean;
}) {
  return {
    id: trade.id,
    pacificaTradeId: trade.pacificaTradeId,
    presetActivationId: trade.presetActivationId,
    symbol: trade.symbol,
    side: trade.side,
    entryPrice: decimalToNumber(trade.entryPrice),
    exitPrice: decimalToNumber(trade.exitPrice),
    quantity: decimalToNumber(trade.quantity),
    capitalAllocated: decimalToNumber(trade.capitalAllocated),
    realizedPnl: decimalToNumber(trade.realizedPnl),
    closeReason: trade.closeReason,
    openedAt: trade.openedAt.toISOString(),
    closedAt: trade.closedAt.toISOString(),
    isPlatformTrade: trade.isPlatformTrade,
  };
}

function mapOperationalAlert(alert: {
  id: string;
  alertType: "connection" | "runtime" | "reconciliation" | "command";
  severity: "info" | "warning" | "error";
  title: string;
  message: string;
  isActive: boolean;
  createdAt: Date;
  resolvedAt: Date | null;
}) {
  return {
    id: alert.id,
    alertType: alert.alertType,
    severity: alert.severity,
    title: alert.title,
    message: alert.message,
    isActive: alert.isActive,
    createdAt: alert.createdAt.toISOString(),
    resolvedAt: alert.resolvedAt?.toISOString() ?? null,
  };
}
