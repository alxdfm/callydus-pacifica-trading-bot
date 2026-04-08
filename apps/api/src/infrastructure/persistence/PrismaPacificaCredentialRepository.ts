import { Prisma, PrismaClient } from "@prisma/client";
import { botRuntimeStateSchema, type PresetSymbol } from "@pacifica/contracts";
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
import type {
  ActivatePresetInput,
  ActivatedPresetRecord,
  PresetActivationRepository,
} from "../../domain/preset-activations/PresetActivationRepository";
import type {
  BotCommandRepository,
  ExecuteBotRuntimeCommandInput,
  ExecuteCloseTradeCommandInput,
} from "../../domain/bot-commands/BotCommandRepository";
import type {
  ApplyPacificaExternalSnapshotInput,
  MarkPacificaSnapshotUnavailableInput,
  RuntimeHeartbeatInput,
  RuntimeMaintenanceRepository,
  RuntimeReconcileInput,
  RuntimeReconcileResult,
} from "../../domain/runtime-maintenance/RuntimeMaintenanceRepository";
import type {
  AppendOperationalEventInput,
  OperationalEventRepository,
} from "../../domain/operational-events/OperationalEventRepository";

export class PrismaPacificaCredentialRepository
  implements
    PacificaCredentialRepository,
    OperationalSessionRepository,
    PresetActivationRepository,
    BotCommandRepository,
    RuntimeMaintenanceRepository,
    OperationalEventRepository
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
        symbolOperationalConfigs: {
          orderBy: {
            symbol: "asc",
          },
        },
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
    const recentEvents = await this.prisma.operationalEvent.findMany({
      where: {
        OR: [
          {
            operatorAccountId: operatorAccount.id,
          },
          {
            walletAddress,
          },
        ],
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 8,
    });
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
        exchangeSnapshotStatus: runtime?.exchangeSnapshotStatus ?? "last_known",
        exchangeLastSyncedAt:
          runtime?.exchangeLastSyncedAt?.toISOString() ?? null,
        exchangeSnapshotMessage: runtime?.exchangeSnapshotMessage ?? null,
        activePresetActivationId: runtime?.activePresetActivationId ?? null,
        symbolOperationalConfigs: mapSymbolOperationalConfigs(
          operatorAccount.symbolOperationalConfigs,
        ),
        lastHeartbeatAt: runtime?.lastHeartbeatAt?.toISOString() ?? null,
        lastErrorMessage: runtime?.lastErrorMessage ?? null,
        currentTrades: operatorAccount.openTrades.map(mapOpenTrade),
        closedTrades: operatorAccount.closedTrades.map(mapClosedTrade),
        activeAlerts: operatorAccount.operationalAlerts.map(mapOperationalAlert),
      },
      recentEvents: recentEvents.map(mapOperationalEvent),
      canAccessProduct,
    };
  }

  async appendOperationalEvent(input: AppendOperationalEventInput) {
    const operatorAccount = input.walletAddress
      ? await this.prisma.operatorAccount.findUnique({
          where: {
            walletAddress: input.walletAddress,
          },
        })
      : null;

    await this.prisma.operationalEvent.create({
      data: {
        operatorAccountId: operatorAccount?.id ?? null,
        walletAddress: input.walletAddress ?? operatorAccount?.walletAddress ?? null,
        eventType: input.eventType,
        severity: input.severity,
        title: input.title,
        message: input.message,
        payloadJson:
          input.payloadJson === undefined
            ? Prisma.JsonNull
            : toPrismaJsonValue(input.payloadJson),
      },
    });
  }

  async activatePreset(
    input: ActivatePresetInput,
  ): Promise<ActivatedPresetRecord | null> {
    return this.prisma.$transaction(async (tx) => {
      const operatorAccount = await tx.operatorAccount.findUnique({
        where: {
          walletAddress: input.walletAddress,
        },
        include: {
          botRuntimeState: true,
        },
      });

      if (!operatorAccount) {
        return null;
      }

      const presetDefinition = getPresetDefinitionRecord(input.presetDefinitionId);

      if (!presetDefinition) {
        return null;
      }

      await tx.presetDefinition.upsert({
        where: {
          id: input.presetDefinitionId,
        },
        update: {
          name: presetDefinition.name,
          slug: presetDefinition.slug,
          version: presetDefinition.version,
          riskLabel: presetDefinition.riskLabel,
          frequencyLabel: presetDefinition.frequencyLabel,
          description: presetDefinition.description,
          baseContractJson: toPrismaInputJsonValue(input.effectiveContract),
          isActive: true,
        },
        create: {
          id: input.presetDefinitionId,
          name: presetDefinition.name,
          slug: presetDefinition.slug,
          version: presetDefinition.version,
          riskLabel: presetDefinition.riskLabel,
          frequencyLabel: presetDefinition.frequencyLabel,
          description: presetDefinition.description,
          baseContractJson: toPrismaInputJsonValue(input.effectiveContract),
          isActive: true,
        },
      });

      await tx.presetActivation.updateMany({
        where: {
          operatorAccountId: operatorAccount.id,
          activationStatus: "active",
        },
        data: {
          activationStatus: "stopped",
          deactivatedAt: new Date(input.nowIso),
        },
      });

      const activation = await tx.presetActivation.create({
        data: {
          operatorAccountId: operatorAccount.id,
          presetDefinitionId: input.presetDefinitionId,
          activationStatus: "active",
          symbol: input.editableConfig.symbol,
          positionSizeType: input.editableConfig.positionSizeType,
          positionSizeValue: input.editableConfig.positionSizeValue,
          longEnabled: input.editableConfig.longEnabled,
          shortEnabled: input.editableConfig.shortEnabled,
          editableConfigJson: toPrismaInputJsonValue(input.editableConfig),
          effectiveContractJson: toPrismaInputJsonValue(input.effectiveContract),
          activatedAt: new Date(input.nowIso),
          deactivatedAt: null,
          createdBy: input.requestedBy,
        },
      });

      const runtime = await tx.botRuntimeState.upsert({
        where: {
          operatorAccountId: operatorAccount.id,
        },
        update: {
          botStatus: "inactive",
          syncStatus: "idle",
          activePresetActivationId: activation.id,
          lastErrorMessage: null,
        },
        create: {
          operatorAccountId: operatorAccount.id,
          botStatus: "inactive",
          pacificaConnectionStatus: "connected",
          syncStatus: "idle",
          activePresetActivationId: activation.id,
          lastHeartbeatAt: null,
          lastErrorMessage: null,
        },
      });

      return {
        activation: mapPresetActivation(activation),
        runtime: mapBotRuntimeState(runtime),
      };
    });
  }

  async pauseBot(input: ExecuteBotRuntimeCommandInput) {
    return this.prisma.$transaction(async (tx) => {
      const operatorAccount = await tx.operatorAccount.findUnique({
        where: {
          walletAddress: input.walletAddress,
        },
        include: {
          botRuntimeState: true,
        },
      });

      if (!operatorAccount) {
        return null;
      }

      if (operatorAccount.botRuntimeState?.botStatus === "paused") {
        const existingCommand = await tx.botCommand.findFirst({
          where: {
            operatorAccountId: operatorAccount.id,
            commandType: "pause_bot",
          },
          orderBy: {
            requestedAt: "desc",
          },
        });

        return existingCommand ? mapBotCommand(existingCommand) : null;
      }

      const runtimeVersionKey =
        operatorAccount.botRuntimeState?.updatedAt?.toISOString() ?? "initial";

      const command = await tx.botCommand.create({
        data: {
          operatorAccountId: operatorAccount.id,
          commandType: "pause_bot",
          targetType: "bot",
          targetId: null,
          payloadJson: Prisma.JsonNull,
          requestedBy: input.requestedBy,
          commandStatus: "completed",
          idempotencyKey: `pause-bot:${input.walletAddress}:${runtimeVersionKey}`,
          requestedAt: new Date(input.nowIso),
          startedAt: new Date(input.nowIso),
          finishedAt: new Date(input.nowIso),
          failureReason: null,
        },
      });

      await tx.botRuntimeState.upsert({
        where: {
          operatorAccountId: operatorAccount.id,
        },
        update: {
          botStatus: "paused",
        },
        create: {
          operatorAccountId: operatorAccount.id,
          botStatus: "paused",
          pacificaConnectionStatus: "connected",
          syncStatus: "idle",
          activePresetActivationId: null,
          lastHeartbeatAt: null,
          lastErrorMessage: null,
        },
      });

      return mapBotCommand(command);
    });
  }

  async upsertSymbolOperationalConfig(input: {
    walletAddress: string;
    config: { symbol: string; leverage: number };
  }) {
    return this.prisma.$transaction(async (tx) => {
      const operatorAccount = await tx.operatorAccount.findUnique({
        where: {
          walletAddress: input.walletAddress,
        },
        include: {
          botRuntimeState: true,
        },
      });

      if (!operatorAccount) {
        return null;
      }

      await tx.symbolOperationalConfig.upsert({
        where: {
          operatorAccountId_symbol: {
            operatorAccountId: operatorAccount.id,
            symbol: input.config.symbol,
          },
        },
        update: {
          leverage: new Prisma.Decimal(input.config.leverage),
        },
        create: {
          operatorAccountId: operatorAccount.id,
          symbol: input.config.symbol,
          leverage: new Prisma.Decimal(input.config.leverage),
        },
      });

      return input.config;
    });
  }

  async replaceSymbolOperationalConfigs(input: {
    walletAddress: string;
    configs: Array<{ symbol: string; leverage: number }>;
  }) {
    return this.prisma.$transaction(async (tx) => {
      const operatorAccount = await tx.operatorAccount.findUnique({
        where: {
          walletAddress: input.walletAddress,
        },
      });

      if (!operatorAccount) {
        return null;
      }

      await tx.symbolOperationalConfig.deleteMany({
        where: {
          operatorAccountId: operatorAccount.id,
        },
      });

      if (input.configs.length > 0) {
        await tx.symbolOperationalConfig.createMany({
          data: input.configs.map((config) => ({
            operatorAccountId: operatorAccount.id,
            symbol: config.symbol,
            leverage: new Prisma.Decimal(config.leverage),
          })),
        });
      }

      return input.configs
        .filter(
          (config) =>
            config.symbol.trim().length > 0 &&
            Number.isFinite(config.leverage) &&
            config.leverage > 0,
        )
        .sort((left, right) => left.symbol.localeCompare(right.symbol));
    });
  }

  async resumeBot(input: ExecuteBotRuntimeCommandInput) {
    return this.prisma.$transaction(async (tx) => {
      const operatorAccount = await tx.operatorAccount.findUnique({
        where: {
          walletAddress: input.walletAddress,
        },
        include: {
          botRuntimeState: true,
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

      const activePreset = operatorAccount.presetActivations[0] ?? null;

      if (!activePreset) {
        return null;
      }

      if (operatorAccount.botRuntimeState?.botStatus === "active") {
        const existingCommand = await tx.botCommand.findFirst({
          where: {
            operatorAccountId: operatorAccount.id,
            commandType: "resume_bot",
          },
          orderBy: {
            requestedAt: "desc",
          },
        });

        return existingCommand ? mapBotCommand(existingCommand) : null;
      }

      const runtimeVersionKey =
        operatorAccount.botRuntimeState?.updatedAt?.toISOString() ?? "initial";

      const command = await tx.botCommand.create({
        data: {
          operatorAccountId: operatorAccount.id,
          commandType: "resume_bot",
          targetType: "bot",
          targetId: null,
          payloadJson: Prisma.JsonNull,
          requestedBy: input.requestedBy,
          commandStatus: "completed",
          idempotencyKey: `resume-bot:${input.walletAddress}:${runtimeVersionKey}`,
          requestedAt: new Date(input.nowIso),
          startedAt: new Date(input.nowIso),
          finishedAt: new Date(input.nowIso),
          failureReason: null,
        },
      });

      await tx.botRuntimeState.upsert({
        where: {
          operatorAccountId: operatorAccount.id,
        },
        update: {
          botStatus: "active",
          activePresetActivationId: activePreset.id,
        },
        create: {
          operatorAccountId: operatorAccount.id,
          botStatus: "active",
          pacificaConnectionStatus: "connected",
          syncStatus: "idle",
          activePresetActivationId: activePreset.id,
          lastHeartbeatAt: null,
          lastErrorMessage: null,
        },
      });

      return mapBotCommand(command);
    });
  }

  async closeTrade(input: ExecuteCloseTradeCommandInput) {
    return this.prisma.$transaction(async (tx) => {
      const operatorAccount = await tx.operatorAccount.findUnique({
        where: {
          walletAddress: input.walletAddress,
        },
      });

      if (!operatorAccount) {
        return null;
      }

      const trade = await tx.openTrade.findFirst({
        where: {
          id: input.tradeId,
          operatorAccountId: operatorAccount.id,
        },
      });

      if (!trade) {
        return null;
      }

      const command = await tx.botCommand.create({
        data: {
          operatorAccountId: operatorAccount.id,
          commandType: "close_trade",
          targetType: "trade",
          targetId: trade.id,
          payloadJson: Prisma.JsonNull,
          requestedBy: input.requestedBy,
          commandStatus: "completed",
          idempotencyKey: input.idempotencyKey,
          requestedAt: new Date(input.nowIso),
          startedAt: new Date(input.nowIso),
          finishedAt: new Date(input.nowIso),
          failureReason: null,
        },
      });

      await tx.closedTrade.create({
        data: {
          operatorAccountId: trade.operatorAccountId,
          pacificaTradeId: trade.pacificaTradeId,
          presetActivationId: trade.presetActivationId,
          symbol: trade.symbol,
          side: trade.side,
          entryPrice: trade.entryPrice,
          exitPrice: trade.currentPrice,
          quantity: trade.quantity,
          capitalAllocated: trade.capitalAllocated,
          realizedPnl: trade.unrealizedPnl,
          closeReason: "manual",
          openedAt: trade.openedAt,
          closedAt: new Date(input.nowIso),
          isPlatformTrade: trade.isPlatformTrade,
          closedByCommandId: command.id,
          lastSyncedAt: new Date(input.nowIso),
        },
      });

      await tx.openTrade.delete({
        where: {
          id: trade.id,
        },
      });

      return mapBotCommand(command);
    });
  }

  async heartbeatRuntime(input: RuntimeHeartbeatInput) {
    /**
     * Persists the latest runtime liveness/status snapshot for an account.
     *
     * Responsibility:
     * - upsert `BotRuntimeState`
     * - refresh `lastHeartbeatAt`
     * - align the runtime with the current active preset reference
     * - resolve prior reconciliation alerts when the runtime is healthy/idle
     */
    return this.prisma.$transaction(async (tx) => {
      const operatorAccount = await tx.operatorAccount.findUnique({
        where: {
          walletAddress: input.walletAddress,
        },
        include: {
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

      const activePreset = operatorAccount.presetActivations[0] ?? null;
      const runtime = await tx.botRuntimeState.upsert({
        where: {
          operatorAccountId: operatorAccount.id,
        },
        update: {
          botStatus: input.botStatus,
          syncStatus: input.syncStatus,
          pacificaConnectionStatus: input.pacificaConnectionStatus,
          lastHeartbeatAt: new Date(input.nowIso),
          lastErrorMessage: input.lastErrorMessage,
          activePresetActivationId: activePreset?.id ?? null,
        },
        create: {
          operatorAccountId: operatorAccount.id,
          botStatus: input.botStatus,
          syncStatus: input.syncStatus,
          pacificaConnectionStatus: input.pacificaConnectionStatus,
          exchangeSnapshotStatus: "last_known",
          exchangeSnapshotMessage: null,
          activePresetActivationId: activePreset?.id ?? null,
          lastHeartbeatAt: new Date(input.nowIso),
          lastErrorMessage: input.lastErrorMessage,
        },
      });

      if (input.syncStatus === "healthy" || input.syncStatus === "idle") {
        await tx.operationalAlert.updateMany({
          where: {
            operatorAccountId: operatorAccount.id,
            alertType: "reconciliation",
            isActive: true,
          },
          data: {
            isActive: false,
            resolvedAt: new Date(input.nowIso),
          },
        });
      }

      return mapBotRuntimeState(runtime);
    });
  }

  async reconcileRuntime(
    input: RuntimeReconcileInput,
  ): Promise<RuntimeReconcileResult | null> {
    /**
     * Runs the minimal internal runtime reconciliation for an account.
     *
     * Responsibility:
     * - detect missing runtime with active preset and recreate a safe runtime
     * - fix runtime/preset reference divergence
     * - detect stale heartbeat and classify degraded/error
     * - create or resolve `OperationalAlert` entries for reconciliation
     *
     * Non-responsibility:
     * - it does not talk to Pacifica
     * - it does not rebuild exchange trades, orders or balances
     */
    return this.prisma.$transaction(async (tx) => {
      const operatorAccount = await tx.operatorAccount.findUnique({
        where: {
          walletAddress: input.walletAddress,
        },
        include: {
          botRuntimeState: true,
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

      const activePreset = operatorAccount.presetActivations[0] ?? null;
      const now = new Date(input.nowIso);
      const runtime = operatorAccount.botRuntimeState;
      let recoveredRuntimeState = false;
      let detectedDivergence = false;
      let alertMessage: string | null = null;

      let nextBotStatus = runtime?.botStatus ?? "inactive";
      let nextSyncStatus = runtime?.syncStatus ?? "idle";
      let nextConnectionStatus = runtime?.pacificaConnectionStatus ?? "connected";
      let nextExchangeSnapshotStatus =
        runtime?.exchangeSnapshotStatus ?? "last_known";
      let nextExchangeLastSyncedAt = runtime?.exchangeLastSyncedAt ?? null;
      let nextExchangeSnapshotMessage = runtime?.exchangeSnapshotMessage ?? null;
      let nextHeartbeatAt = runtime?.lastHeartbeatAt ?? null;
      let nextLastErrorMessage = runtime?.lastErrorMessage ?? null;
      let nextActivePresetActivationId = runtime?.activePresetActivationId ?? null;

      if (!runtime && activePreset) {
        recoveredRuntimeState = true;
        detectedDivergence = true;
        alertMessage =
          "Runtime state was recreated after a missing persisted runtime record.";
        nextBotStatus = "paused";
        nextSyncStatus = "degraded";
        nextConnectionStatus = "connected";
        nextHeartbeatAt = null;
        nextLastErrorMessage = alertMessage;
        nextActivePresetActivationId = activePreset.id;
      }

      if (activePreset && nextActivePresetActivationId !== activePreset.id) {
        detectedDivergence = true;
        alertMessage =
          "Runtime preset reference was recovered to the current active preset.";
        nextActivePresetActivationId = activePreset.id;
        nextSyncStatus = "degraded";
        nextLastErrorMessage = alertMessage;
      }

      if (!activePreset && nextActivePresetActivationId) {
        detectedDivergence = true;
        alertMessage =
          "Runtime referenced a preset activation that is no longer active.";
        nextActivePresetActivationId = null;
        nextSyncStatus = "degraded";
        nextLastErrorMessage = alertMessage;
      }

      const requiresHeartbeat =
        nextBotStatus === "active" || nextBotStatus === "syncing";

      if (requiresHeartbeat) {
        const heartbeatAgeMs = nextHeartbeatAt
          ? now.getTime() - nextHeartbeatAt.getTime()
          : Number.POSITIVE_INFINITY;

        if (heartbeatAgeMs >= input.errorAfterMs) {
          detectedDivergence = true;
          alertMessage =
            "Runtime heartbeat is stale beyond the error threshold.";
          nextSyncStatus = "error";
          nextConnectionStatus = "error";
          nextLastErrorMessage = alertMessage;
        } else if (heartbeatAgeMs >= input.degradedAfterMs) {
          detectedDivergence = true;
          alertMessage =
            "Runtime heartbeat is stale and the runtime is currently degraded.";
          nextSyncStatus = "degraded";
          nextConnectionStatus = "degraded";
          nextLastErrorMessage = alertMessage;
        } else if (
          !detectedDivergence &&
          (nextSyncStatus === "degraded" || nextSyncStatus === "error")
        ) {
          nextSyncStatus = "healthy";
          nextConnectionStatus = "connected";
          nextLastErrorMessage = null;
        }
      } else if (!detectedDivergence) {
        nextSyncStatus = "idle";
        if (nextConnectionStatus === "error" || nextConnectionStatus === "degraded") {
          nextConnectionStatus = "connected";
        }
        nextLastErrorMessage = null;
      }

      const persistedRuntime = runtime
        ? await tx.botRuntimeState.update({
            where: {
              operatorAccountId: operatorAccount.id,
            },
            data: {
              botStatus: nextBotStatus,
              syncStatus: nextSyncStatus,
              pacificaConnectionStatus: nextConnectionStatus,
              exchangeSnapshotStatus: nextExchangeSnapshotStatus,
              exchangeLastSyncedAt: nextExchangeLastSyncedAt,
              exchangeSnapshotMessage: nextExchangeSnapshotMessage,
              activePresetActivationId: nextActivePresetActivationId,
              lastHeartbeatAt: nextHeartbeatAt,
              lastErrorMessage: nextLastErrorMessage,
            },
          })
        : await tx.botRuntimeState.create({
            data: {
              operatorAccountId: operatorAccount.id,
              botStatus: nextBotStatus,
              syncStatus: nextSyncStatus,
              pacificaConnectionStatus: nextConnectionStatus,
              exchangeSnapshotStatus: nextExchangeSnapshotStatus,
              exchangeLastSyncedAt: nextExchangeLastSyncedAt,
              exchangeSnapshotMessage: nextExchangeSnapshotMessage,
              activePresetActivationId: nextActivePresetActivationId,
              lastHeartbeatAt: nextHeartbeatAt,
              lastErrorMessage: nextLastErrorMessage,
            },
          });

      await tx.operationalAlert.updateMany({
        where: {
          operatorAccountId: operatorAccount.id,
          alertType: "reconciliation",
          isActive: true,
        },
        data: {
          isActive: false,
          resolvedAt: now,
        },
      });

      if (detectedDivergence && alertMessage) {
        await tx.operationalAlert.create({
          data: {
            operatorAccountId: operatorAccount.id,
            alertType: "reconciliation",
            severity: nextSyncStatus === "error" ? "error" : "warning",
            title:
              nextSyncStatus === "error"
                ? "Runtime reconciliation error"
                : "Runtime reconciliation warning",
            message: alertMessage,
            isActive: true,
            createdAt: now,
            resolvedAt: null,
          },
        });

        await tx.operationalEvent.create({
          data: {
            operatorAccountId: operatorAccount.id,
            walletAddress: operatorAccount.walletAddress,
            eventType: "runtime_reconciliation",
            severity: nextSyncStatus === "error" ? "error" : "warning",
            title:
              nextSyncStatus === "error"
                ? "Runtime reconciliation error"
                : "Runtime reconciliation warning",
            message: alertMessage,
            payloadJson: toPrismaInputJsonValue({
              recoveredRuntimeState,
              detectedDivergence,
              nextSyncStatus,
              nextBotStatus,
            }),
          },
        });
      }

      return {
        runtime: mapBotRuntimeState(persistedRuntime),
        recoveredRuntimeState,
        detectedDivergence,
        alertMessage,
      };
    });
  }

  async applyPacificaExternalSnapshot(
    input: ApplyPacificaExternalSnapshotInput,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const operatorAccount = await tx.operatorAccount.findUnique({
        where: {
          walletAddress: input.walletAddress,
        },
        include: {
          botRuntimeState: true,
          openTrades: {
            orderBy: {
              openedAt: "asc",
            },
          },
        },
      });

      if (!operatorAccount) {
        return;
      }

      if (input.snapshot.balance) {
        await tx.accountBalanceSnapshot.create({
          data: {
            operatorAccountId: operatorAccount.id,
            totalBalance: new Prisma.Decimal(input.snapshot.balance.totalBalance),
            availableBalance: new Prisma.Decimal(
              input.snapshot.balance.availableBalance,
            ),
            aggregatedPnl: new Prisma.Decimal(
              input.snapshot.balance.aggregatedPnl,
            ),
            capitalInUse: new Prisma.Decimal(input.snapshot.balance.capitalInUse),
            capturedAt: new Date(input.snapshot.balance.capturedAtIso),
          },
        });
      }

      const openTradesBySymbol = new Map(
        operatorAccount.openTrades.map((trade) => [trade.symbol, trade]),
      );
      const externalSymbols = new Set(
        input.snapshot.positions.map((position) => position.symbol),
      );
      let detectedDivergence = false;
      let divergenceMessage: string | null = null;

      for (const position of input.snapshot.positions) {
        const existingTrade = openTradesBySymbol.get(position.symbol) ?? null;

        if (existingTrade) {
          await tx.openTrade.update({
            where: {
              id: existingTrade.id,
            },
            data: {
              pacificaTradeId: position.pacificaTradeId,
              side: position.side,
              entryPrice: new Prisma.Decimal(position.entryPrice),
              currentPrice: new Prisma.Decimal(position.currentPrice),
              quantity: new Prisma.Decimal(position.quantity),
              capitalAllocated: new Prisma.Decimal(
                position.entryPrice * position.quantity,
              ),
              unrealizedPnl: new Prisma.Decimal(position.unrealizedPnl),
              tradeStatus: "open",
              isPlatformTrade:
                existingTrade.isPlatformTrade || position.isPlatformTrade,
              lastSyncedAt: new Date(input.snapshot.fetchedAtIso),
            },
          });
        } else {
          detectedDivergence = true;
          divergenceMessage =
            divergenceMessage ??
            "Pacifica reported an open position that was missing from the local runtime.";
          await tx.openTrade.create({
            data: {
              operatorAccountId: operatorAccount.id,
              pacificaTradeId: position.pacificaTradeId,
              presetActivationId: null,
              stopLossPrice: null,
              takeProfitPrice: null,
              entryClientOrderId: null,
              pacificaOrderId: null,
              symbol: position.symbol,
              side: position.side,
              entryPrice: new Prisma.Decimal(position.entryPrice),
              currentPrice: new Prisma.Decimal(position.currentPrice),
              quantity: new Prisma.Decimal(position.quantity),
              capitalAllocated: new Prisma.Decimal(
                position.entryPrice * position.quantity,
              ),
              unrealizedPnl: new Prisma.Decimal(position.unrealizedPnl),
              tradeStatus: "open",
              openedAt: new Date(input.snapshot.fetchedAtIso),
              closeRequestedAt: null,
              closeReasonPending: null,
              isPlatformTrade: position.isPlatformTrade,
              lastSyncedAt: new Date(input.snapshot.fetchedAtIso),
            },
          });
        }
      }

      for (const localTrade of operatorAccount.openTrades) {
        if (externalSymbols.has(localTrade.symbol)) {
          continue;
        }

        detectedDivergence = true;
        divergenceMessage =
          divergenceMessage ??
          "Pacifica no longer reports one of the local open trades.";
        const matchingClose = findMatchingExternalCloseEvent(
          localTrade.symbol,
          localTrade.side,
          input.snapshot.recentTradeHistory,
        );

        await tx.closedTrade.create({
          data: {
            operatorAccountId: localTrade.operatorAccountId,
            pacificaTradeId: localTrade.pacificaTradeId,
            presetActivationId: localTrade.presetActivationId,
            symbol: localTrade.symbol,
            side: localTrade.side,
            entryPrice: localTrade.entryPrice,
            exitPrice: new Prisma.Decimal(
              matchingClose?.price ??
                Number(localTrade.currentPrice.toString()),
            ),
            quantity: localTrade.quantity,
            capitalAllocated: localTrade.capitalAllocated,
            realizedPnl: new Prisma.Decimal(
              matchingClose?.pnl ?? Number(localTrade.unrealizedPnl.toString()),
            ),
            closeReason:
              matchingClose?.closeReason ??
              (localTrade.closeReasonPending ?? "system"),
            openedAt: localTrade.openedAt,
            closedAt: new Date(
              matchingClose?.createdAtIso ?? input.snapshot.fetchedAtIso,
            ),
            isPlatformTrade: localTrade.isPlatformTrade,
            closedByCommandId: null,
            lastSyncedAt: new Date(input.snapshot.fetchedAtIso),
          },
        });
        await tx.openTrade.delete({
          where: {
            id: localTrade.id,
          },
        });
      }

      const nextSyncStatus =
        operatorAccount.botRuntimeState?.syncStatus === "error"
          ? "error"
          : detectedDivergence
            ? "degraded"
            : operatorAccount.botRuntimeState?.botStatus === "active" ||
                operatorAccount.botRuntimeState?.botStatus === "syncing"
              ? "healthy"
              : "idle";

      await tx.botRuntimeState.upsert({
        where: {
          operatorAccountId: operatorAccount.id,
        },
        update: {
          pacificaConnectionStatus: "connected",
          exchangeSnapshotStatus: "confirmed",
          exchangeLastSyncedAt: new Date(input.snapshot.fetchedAtIso),
          exchangeSnapshotMessage: null,
          syncStatus: nextSyncStatus,
          ...(detectedDivergence
            ? { lastErrorMessage: divergenceMessage }
            : {}),
        },
        create: {
          operatorAccountId: operatorAccount.id,
          botStatus: "inactive",
          pacificaConnectionStatus: "connected",
          syncStatus: nextSyncStatus,
          exchangeSnapshotStatus: "confirmed",
          exchangeLastSyncedAt: new Date(input.snapshot.fetchedAtIso),
          exchangeSnapshotMessage: null,
          activePresetActivationId: null,
          lastHeartbeatAt: null,
          lastErrorMessage: detectedDivergence ? divergenceMessage : null,
        },
      });

      await tx.operationalAlert.updateMany({
        where: {
          operatorAccountId: operatorAccount.id,
          alertType: "connection",
          isActive: true,
        },
        data: {
          isActive: false,
          resolvedAt: new Date(input.nowIso),
        },
      });

      if (detectedDivergence && divergenceMessage) {
        await tx.operationalAlert.create({
          data: {
            operatorAccountId: operatorAccount.id,
            alertType: "reconciliation",
            severity: "warning",
            title: "Pacifica reconciliation drift detected",
            message: divergenceMessage,
            isActive: true,
          },
        });
        await tx.operationalEvent.create({
          data: {
            operatorAccountId: operatorAccount.id,
            walletAddress: operatorAccount.walletAddress,
            eventType: "runtime_reconciliation",
            severity: "warning",
            title: "Pacifica reconciliation drift detected",
            message: divergenceMessage,
            payloadJson: toPrismaInputJsonValue({
              positions: input.snapshot.positions.length,
              openOrderCount: input.snapshot.orderHistorySummary.openOrderCount,
              stopOrderCount: input.snapshot.orderHistorySummary.stopOrderCount,
              lastOrderId: input.snapshot.orderHistorySummary.lastOrderId,
            }),
          },
        });
      }
    });
  }

  async markPacificaSnapshotUnavailable(
    input: MarkPacificaSnapshotUnavailableInput,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const operatorAccount = await tx.operatorAccount.findUnique({
        where: {
          walletAddress: input.walletAddress,
        },
      });

      if (!operatorAccount) {
        return;
      }

      await tx.botRuntimeState.upsert({
        where: {
          operatorAccountId: operatorAccount.id,
        },
        update: {
          pacificaConnectionStatus: "degraded",
          exchangeSnapshotStatus: "last_known",
          exchangeSnapshotMessage: input.message,
          lastErrorMessage: input.message,
        },
        create: {
          operatorAccountId: operatorAccount.id,
          botStatus: "inactive",
          pacificaConnectionStatus: "degraded",
          syncStatus: "degraded",
          exchangeSnapshotStatus: "last_known",
          exchangeLastSyncedAt: null,
          exchangeSnapshotMessage: input.message,
          activePresetActivationId: null,
          lastHeartbeatAt: null,
          lastErrorMessage: input.message,
        },
      });

      await tx.operationalAlert.updateMany({
        where: {
          operatorAccountId: operatorAccount.id,
          alertType: "connection",
          isActive: true,
        },
        data: {
          isActive: false,
          resolvedAt: new Date(input.nowIso),
        },
      });

      await tx.operationalAlert.create({
        data: {
          operatorAccountId: operatorAccount.id,
          alertType: "connection",
          severity: "warning",
          title: "Pacifica snapshot unavailable",
          message: input.message,
          isActive: true,
        },
      });
    });
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

function toPrismaInputJsonValue(value: unknown): Prisma.InputJsonValue {
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
      symbol: activation.symbol as PresetSymbol,
      positionSizeType: activation.positionSizeType,
      positionSizeValue: decimalToNumber(activation.positionSizeValue),
      longEnabled: activation.longEnabled,
      shortEnabled: activation.shortEnabled,
    },
    activatedAt: activation.activatedAt?.toISOString() ?? null,
    deactivatedAt: activation.deactivatedAt?.toISOString() ?? null,
  };
}

function mapBotRuntimeState(runtime: {
  botStatus: "inactive" | "active" | "paused" | "syncing" | "error";
  pacificaConnectionStatus:
    | "disconnected"
    | "connecting"
    | "connected"
    | "degraded"
    | "error";
  syncStatus: "idle" | "syncing" | "healthy" | "degraded" | "error";
  exchangeSnapshotStatus: "confirmed" | "last_known";
  exchangeLastSyncedAt: Date | null;
  exchangeSnapshotMessage: string | null;
  activePresetActivationId: string | null;
  lastHeartbeatAt: Date | null;
  lastErrorMessage: string | null;
  symbolOperationalConfigs?: Array<{ symbol: string; leverage: Prisma.Decimal }>;
}) {
  return botRuntimeStateSchema.parse({
    botStatus: runtime.botStatus,
    pacificaConnectionStatus: runtime.pacificaConnectionStatus,
    syncStatus: runtime.syncStatus,
    exchangeSnapshotStatus: runtime.exchangeSnapshotStatus,
    exchangeLastSyncedAt: runtime.exchangeLastSyncedAt?.toISOString() ?? null,
    exchangeSnapshotMessage: runtime.exchangeSnapshotMessage,
    activePresetActivationId: runtime.activePresetActivationId,
    symbolOperationalConfigs: mapSymbolOperationalConfigs(
      runtime.symbolOperationalConfigs ?? [],
    ),
    lastHeartbeatAt: runtime.lastHeartbeatAt?.toISOString() ?? null,
    lastErrorMessage: runtime.lastErrorMessage,
  });
}

function mapSymbolOperationalConfigs(
  configs: Array<{ symbol: string; leverage: Prisma.Decimal }>,
) {
  return configs
    .map((config) => ({
      symbol: config.symbol.trim(),
      leverage: Number(config.leverage.toString()),
    }))
    .filter(
      (config) =>
        Boolean(config.symbol) &&
        Number.isFinite(config.leverage) &&
        config.leverage > 0,
    )
    .sort((left, right) => left.symbol.localeCompare(right.symbol));
}

function findMatchingExternalCloseEvent(
  symbol: string,
  side: "long" | "short",
  recentTradeHistory: Array<{
    symbol: string;
    side: "open_long" | "open_short" | "close_long" | "close_short";
    clientOrderId: string | null;
    price: number;
    pnl: number;
    createdAtIso: string;
  }>,
) {
  const expectedSide = side === "long" ? "close_long" : "close_short";
  const match = recentTradeHistory.find(
    (trade) => trade.symbol === symbol && trade.side === expectedSide,
  );

  if (!match) {
    return null;
  }

  return {
    price: match.price,
    pnl: match.pnl,
    createdAtIso: match.createdAtIso,
    closeReason:
      match.clientOrderId?.endsWith(":tp")
        ? ("take_profit" as const)
        : match.clientOrderId?.endsWith(":sl")
          ? ("stop_loss" as const)
          : ("system" as const),
  };
}

function mapBotCommand(command: {
  id: string;
  commandType:
    | "validate_credentials"
    | "activate_preset"
    | "pause_bot"
    | "resume_bot"
    | "close_trade";
  commandStatus:
    | "pending"
    | "running"
    | "completed"
    | "failed"
    | "cancelled";
  targetType: "credential" | "preset_activation" | "trade" | "bot" | null;
  targetId: string | null;
  requestedAt: Date;
  finishedAt: Date | null;
  failureReason: string | null;
}) {
  return {
    id: command.id,
    commandType: command.commandType,
    commandStatus: command.commandStatus,
    targetType: command.targetType,
    targetId: command.targetId,
    requestedAt: command.requestedAt.toISOString(),
    finishedAt: command.finishedAt?.toISOString() ?? null,
    failureReason: command.failureReason,
  };
}

function getPresetDefinitionRecord(presetDefinitionId: string) {
  switch (presetDefinitionId) {
    case "2d5a5641-c7ad-4ff0-9f75-4fbcb58a4d01":
      return {
        name: "Safer",
        slug: "safer",
        version: 1,
        riskLabel: "Low risk",
        frequencyLabel: "Low frequency",
        description: "Lower activity and stronger protection.",
      };
    case "54663f73-b1e9-4384-9057-48d68ba689b2":
      return {
        name: "Balanced",
        slug: "balanced",
        version: 1,
        riskLabel: "Medium risk",
        frequencyLabel: "Medium frequency",
        description: "Best default for the MVP with controlled exposure.",
      };
    case "1242f0f9-7a5b-44ea-b32d-368ceba95a93":
      return {
        name: "More active",
        slug: "more-active",
        version: 1,
        riskLabel: "Higher activity",
        frequencyLabel: "Higher frequency",
        description: "More opportunities with looser selection rules.",
      };
    default:
      return null;
  }
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

function mapOperationalEvent(event: {
  id: string;
  eventType:
    | "credential_validation"
    | "operational_verification"
    | "signal_evaluation"
    | "order_execution"
    | "preset_activation"
    | "bot_command"
    | "runtime_reconciliation";
  severity: "info" | "warning" | "error";
  title: string;
  message: string;
  payloadJson: Prisma.JsonValue | null;
  createdAt: Date;
}) {
  return {
    id: event.id,
    eventType: event.eventType,
    severity: event.severity,
    title: event.title,
    message: event.message,
    payloadJson: event.payloadJson,
    createdAt: event.createdAt.toISOString(),
  };
}
