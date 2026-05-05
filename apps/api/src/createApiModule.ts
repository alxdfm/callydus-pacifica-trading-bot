import type { PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";

import {
  createApprovePacificaBuilder,
  type ApprovePacificaBuilderDependencies,
} from "./application/approve-pacifica-builder/ApprovePacificaBuilder";
import {
  createActivateYourStrategy,
  type ActivateYourStrategyDependencies,
} from "./application/activate-your-strategy/ActivateYourStrategy";
import {
  createCloseTrade,
  type CloseTradeDependencies,
} from "./application/close-trade/CloseTrade";
import {
  createHeartbeatRuntime,
  type HeartbeatRuntimeDependencies,
} from "./application/heartbeat-runtime/HeartbeatRuntime";
import {
  createLookupOperationalAccountByWallet,
  type LookupOperationalAccountByWalletDependencies,
} from "./application/lookup-operational-account-by-wallet/LookupOperationalAccountByWallet";
import {
  createGetOperationalSessionByWallet,
  type GetOperationalSessionByWalletDependencies,
} from "./application/get-operational-session-by-wallet/GetOperationalSessionByWallet";
import { createGetOperationalSessionSliceByWallet } from "./application/get-operational-session-slice-by-wallet/GetOperationalSessionSliceByWallet";
import {
  createSynchronizePacificaAccountState,
  type SynchronizePacificaAccountStateDependencies,
} from "./application/synchronize-pacifica-account-state/SynchronizePacificaAccountState";
import {
  createPauseBot,
  type PauseBotDependencies,
} from "./application/pause-bot/PauseBot";
import {
  createPreviewYourStrategyBacktest,
  type PreviewYourStrategyBacktestDependencies,
} from "./application/preview-your-strategy-backtest/PreviewYourStrategyBacktest";
import {
  createReconcileRuntime,
  type ReconcileRuntimeDependencies,
} from "./application/reconcile-runtime/ReconcileRuntime";
import {
  createResumeBot,
  type ResumeBotDependencies,
} from "./application/resume-bot/ResumeBot";
import {
  createStartBotReadinessCheck,
  type StartBotReadinessCheckDependencies,
} from "./application/start-bot-readiness-check/StartBotReadinessCheck";
import {
  createSaveYourStrategy,
  type SaveYourStrategyDependencies,
} from "./application/save-your-strategy/SaveYourStrategy";
import {
  createVerifyPacificaOperational,
  type VerifyPacificaOperationalDependencies,
} from "./application/verify-pacifica-operational/VerifyPacificaOperational";
import {
  createValidatePacificaCredentials,
  type ValidatePacificaCredentialsDependencies,
} from "./application/validate-pacifica-credentials/ValidatePacificaCredentials";
import {
  createApiEnvironment,
  type ApiEnvironment,
} from "./infrastructure/config/createApiEnvironment";
import { AesCredentialEncryptionService } from "./infrastructure/crypto/AesCredentialEncryptionService";
import { PacificaBuilderApprovalGateway } from "./infrastructure/pacifica/PacificaBuilderApprovalGateway";
import { PacificaAccountStateGateway } from "./infrastructure/pacifica/PacificaAccountStateGateway";
import { PacificaCredentialValidationGateway } from "./infrastructure/pacifica/PacificaCredentialValidationGateway";
import { PacificaOperationalVerificationGateway } from "./infrastructure/pacifica/PacificaOperationalVerificationGateway";
import { PacificaStartBotReadinessGateway } from "./infrastructure/pacifica/PacificaStartBotReadinessGateway";
import { PrismaPacificaCredentialRepository } from "./infrastructure/persistence/PrismaPacificaCredentialRepository";
import { createApiRouter } from "./ui/http/createApiRouter";
import { BearerTokenService } from "./infrastructure/auth/BearerTokenService";
import { PrismaAuthRepository } from "./infrastructure/persistence/PrismaAuthRepository";
import { createRequestAuthNonce } from "./application/request-auth-nonce/RequestAuthNonce";
import { createVerifyAuthSignature } from "./application/verify-auth-signature/VerifyAuthSignature";

type CreateApiModuleInput = {
  environment?: Partial<ApiEnvironment>;
  prisma: PrismaClient;
  approvePacificaBuilderDependencies?: Partial<ApprovePacificaBuilderDependencies>;
  activateYourStrategyDependencies?: Partial<ActivateYourStrategyDependencies>;
  closeTradeDependencies?: Partial<CloseTradeDependencies>;
  previewYourStrategyBacktestDependencies?: Partial<PreviewYourStrategyBacktestDependencies>;
  heartbeatRuntimeDependencies?: Partial<HeartbeatRuntimeDependencies>;
  lookupOperationalAccountByWalletDependencies?: Partial<LookupOperationalAccountByWalletDependencies>;
  getOperationalSessionByWalletDependencies?: Partial<GetOperationalSessionByWalletDependencies>;
  synchronizePacificaAccountStateDependencies?: Partial<SynchronizePacificaAccountStateDependencies>;
  pauseBotDependencies?: Partial<PauseBotDependencies>;
  reconcileRuntimeDependencies?: Partial<ReconcileRuntimeDependencies>;
  resumeBotDependencies?: Partial<ResumeBotDependencies>;
  saveYourStrategyDependencies?: Partial<SaveYourStrategyDependencies>;
  startBotReadinessCheckDependencies?: Partial<StartBotReadinessCheckDependencies>;
  verifyPacificaOperationalDependencies?: Partial<VerifyPacificaOperationalDependencies>;
  validatePacificaCredentialsDependencies?: Partial<ValidatePacificaCredentialsDependencies>;
};

export function createApiModule(input: CreateApiModuleInput) {
  const environment = createApiEnvironment(input.environment);

  const approvePacificaBuilder = createApprovePacificaBuilder({
    builderApproval:
      input.approvePacificaBuilderDependencies?.builderApproval ??
      new PacificaBuilderApprovalGateway(environment),
  });
  const defaultCredentialRepository = new PrismaPacificaCredentialRepository(
    input.prisma,
  );
  const startBotReadinessGateway = new PacificaStartBotReadinessGateway(
    environment,
  );
  const previewYourStrategyBacktest = createPreviewYourStrategyBacktest({
    ...(input.previewYourStrategyBacktestDependencies?.marketData
      ? { marketData: input.previewYourStrategyBacktestDependencies.marketData }
      : {}),
    repository:
      input.previewYourStrategyBacktestDependencies?.repository ??
      defaultCredentialRepository,
  });

  const activateYourStrategy = createActivateYourStrategy({
    credentialRepository:
      input.activateYourStrategyDependencies?.credentialRepository ??
      defaultCredentialRepository,
    yourStrategyRepository:
      input.activateYourStrategyDependencies?.yourStrategyRepository ??
      defaultCredentialRepository,
    presetActivationRepository:
      input.activateYourStrategyDependencies?.presetActivationRepository ??
      defaultCredentialRepository,
    eventRepository:
      input.activateYourStrategyDependencies?.eventRepository ??
      defaultCredentialRepository,
    ...(input.activateYourStrategyDependencies?.now
      ? { now: input.activateYourStrategyDependencies.now }
      : {}),
  });
  const pauseBot = createPauseBot({
    commandRepository:
      input.pauseBotDependencies?.commandRepository ??
      defaultCredentialRepository,
    eventRepository:
      input.pauseBotDependencies?.eventRepository ??
      defaultCredentialRepository,
    ...(input.pauseBotDependencies?.now
      ? { now: input.pauseBotDependencies.now }
      : {}),
  });
  const credentialEncryption =
    input.validatePacificaCredentialsDependencies?.credentialEncryption ??
    new AesCredentialEncryptionService(
      environment.credentialEncryptionKey,
      environment.credentialEncryptionKeyId,
    );
  const startBotReadinessCheck = createStartBotReadinessCheck({
    sessionRepository: defaultCredentialRepository,
    credentialRepository: defaultCredentialRepository,
    credentialEncryption,
    startBotReadiness:
      input.startBotReadinessCheckDependencies?.startBotReadiness ??
      startBotReadinessGateway,
    eventRepository:
      input.startBotReadinessCheckDependencies?.eventRepository ??
      defaultCredentialRepository,
  });
  const saveYourStrategy = createSaveYourStrategy({
    repository:
      input.saveYourStrategyDependencies?.repository ??
      defaultCredentialRepository,
  });
  const resumeBot = createResumeBot({
    commandRepository:
      input.resumeBotDependencies?.commandRepository ??
      defaultCredentialRepository,
    startBotReadinessCheck,
    eventRepository:
      input.resumeBotDependencies?.eventRepository ??
      defaultCredentialRepository,
    ...(input.resumeBotDependencies?.now
      ? { now: input.resumeBotDependencies.now }
      : {}),
  });
  const closeTrade = createCloseTrade({
    commandRepository:
      input.closeTradeDependencies?.commandRepository ??
      defaultCredentialRepository,
    eventRepository:
      input.closeTradeDependencies?.eventRepository ??
      defaultCredentialRepository,
    ...(input.closeTradeDependencies?.now
      ? { now: input.closeTradeDependencies.now }
      : {}),
  });
  const credentialRepository =
    input.validatePacificaCredentialsDependencies?.credentialRepository ??
    defaultCredentialRepository;
  const lookupOperationalAccountByWallet =
    createLookupOperationalAccountByWallet({
      credentialRepository:
        input.lookupOperationalAccountByWalletDependencies
          ?.credentialRepository ?? credentialRepository,
    });
  const heartbeatRuntime = createHeartbeatRuntime({
    runtimeMaintenanceRepository:
      input.heartbeatRuntimeDependencies?.runtimeMaintenanceRepository ??
      defaultCredentialRepository,
    ...(input.heartbeatRuntimeDependencies?.now
      ? { now: input.heartbeatRuntimeDependencies.now }
      : {}),
  });
  const reconcileRuntime = createReconcileRuntime({
    runtimeMaintenanceRepository:
      input.reconcileRuntimeDependencies?.runtimeMaintenanceRepository ??
      defaultCredentialRepository,
    ...(input.reconcileRuntimeDependencies?.now
      ? { now: input.reconcileRuntimeDependencies.now }
      : {}),
    ...(input.reconcileRuntimeDependencies?.degradedAfterMs
      ? { degradedAfterMs: input.reconcileRuntimeDependencies.degradedAfterMs }
      : {}),
    ...(input.reconcileRuntimeDependencies?.errorAfterMs
      ? { errorAfterMs: input.reconcileRuntimeDependencies.errorAfterMs }
      : {}),
  });
  const synchronizePacificaAccountState = createSynchronizePacificaAccountState(
    {
      pacificaAccountState:
        input.synchronizePacificaAccountStateDependencies
          ?.pacificaAccountState ??
        new PacificaAccountStateGateway(environment),
      runtimeMaintenanceRepository:
        input.synchronizePacificaAccountStateDependencies
          ?.runtimeMaintenanceRepository ?? defaultCredentialRepository,
      ...(input.synchronizePacificaAccountStateDependencies?.now
        ? { now: input.synchronizePacificaAccountStateDependencies.now }
        : {}),
    },
  );
  const operationalSessionRepository =
    input.getOperationalSessionByWalletDependencies
      ?.operationalSessionRepository ?? defaultCredentialRepository;
  const runtimeMaintenanceRepository =
    input.getOperationalSessionByWalletDependencies
      ?.runtimeMaintenanceRepository ?? defaultCredentialRepository;
  const synchronizePacificaSymbolOperationalConfigs = async ({
    walletAddress,
  }: {
    walletAddress: string;
  }) => {
    const configs =
      await startBotReadinessGateway.listEffectiveSymbolOperationalConfigs(
        walletAddress,
      );

    await defaultCredentialRepository.replaceSymbolOperationalConfigs({
      walletAddress,
      configs,
    });
  };
  const getOperationalSessionByWallet = createGetOperationalSessionByWallet({
    operationalSessionRepository,
    runtimeMaintenanceRepository,
    ...(input.getOperationalSessionByWalletDependencies?.now
      ? { now: input.getOperationalSessionByWalletDependencies.now }
      : {}),
    ...(input.getOperationalSessionByWalletDependencies?.degradedAfterMs
      ? {
          degradedAfterMs:
            input.getOperationalSessionByWalletDependencies.degradedAfterMs,
        }
      : {}),
    ...(input.getOperationalSessionByWalletDependencies?.errorAfterMs
      ? {
          errorAfterMs:
            input.getOperationalSessionByWalletDependencies.errorAfterMs,
        }
      : {}),
    synchronizePacificaAccountState,
    synchronizePacificaSymbolOperationalConfigs,
  });
  const getOperationalProfileByWallet =
    createGetOperationalSessionSliceByWallet({
      readSession: (walletAddress) =>
        operationalSessionRepository.findProfileByWalletAddress(walletAddress),
      runtimeMaintenanceRepository,
      ...(input.getOperationalSessionByWalletDependencies?.now
        ? { now: input.getOperationalSessionByWalletDependencies.now }
        : {}),
      ...(input.getOperationalSessionByWalletDependencies?.degradedAfterMs
        ? {
            degradedAfterMs:
              input.getOperationalSessionByWalletDependencies.degradedAfterMs,
          }
        : {}),
      ...(input.getOperationalSessionByWalletDependencies?.errorAfterMs
        ? {
            errorAfterMs:
              input.getOperationalSessionByWalletDependencies.errorAfterMs,
          }
        : {}),
    });
  const getOperationalDashboardByWallet =
    createGetOperationalSessionSliceByWallet({
      readSession: (walletAddress) =>
        operationalSessionRepository.findDashboardByWalletAddress(
          walletAddress,
        ),
      runtimeMaintenanceRepository,
      ...(input.getOperationalSessionByWalletDependencies?.now
        ? { now: input.getOperationalSessionByWalletDependencies.now }
        : {}),
      ...(input.getOperationalSessionByWalletDependencies?.degradedAfterMs
        ? {
            degradedAfterMs:
              input.getOperationalSessionByWalletDependencies.degradedAfterMs,
          }
        : {}),
      ...(input.getOperationalSessionByWalletDependencies?.errorAfterMs
        ? {
            errorAfterMs:
              input.getOperationalSessionByWalletDependencies.errorAfterMs,
          }
        : {}),
      synchronizePacificaAccountState,
      refreshPacificaAccountState: true,
    });
  const getOperationalPresetsByWallet =
    createGetOperationalSessionSliceByWallet({
      readSession: async (walletAddress) => {
        const session =
          await operationalSessionRepository.findPresetsByWalletAddress(
            walletAddress,
          );

        if (!session) {
          return null;
        }

        return {
          ...session,
          marketInfo: [],
          yourStrategy: session.yourStrategy,
        };
      },
      runtimeMaintenanceRepository,
      ...(input.getOperationalSessionByWalletDependencies?.now
        ? { now: input.getOperationalSessionByWalletDependencies.now }
        : {}),
      ...(input.getOperationalSessionByWalletDependencies?.degradedAfterMs
        ? {
            degradedAfterMs:
              input.getOperationalSessionByWalletDependencies.degradedAfterMs,
          }
        : {}),
      ...(input.getOperationalSessionByWalletDependencies?.errorAfterMs
        ? {
            errorAfterMs:
              input.getOperationalSessionByWalletDependencies.errorAfterMs,
          }
        : {}),
      synchronizePacificaAccountState,
      synchronizePacificaSymbolOperationalConfigs,
      refreshPacificaAccountState: true,
      refreshSymbolOperationalConfigs: true,
    });
  const getOperationalTradesByWallet = createGetOperationalSessionSliceByWallet(
    {
      readSession: (walletAddress) =>
        operationalSessionRepository.findTradesByWalletAddress(walletAddress),
      runtimeMaintenanceRepository,
      ...(input.getOperationalSessionByWalletDependencies?.now
        ? { now: input.getOperationalSessionByWalletDependencies.now }
        : {}),
      ...(input.getOperationalSessionByWalletDependencies?.degradedAfterMs
        ? {
            degradedAfterMs:
              input.getOperationalSessionByWalletDependencies.degradedAfterMs,
          }
        : {}),
      ...(input.getOperationalSessionByWalletDependencies?.errorAfterMs
        ? {
            errorAfterMs:
              input.getOperationalSessionByWalletDependencies.errorAfterMs,
          }
        : {}),
      synchronizePacificaAccountState,
      refreshPacificaAccountState: true,
    },
  );
  const getOperationalHistoryByWallet =
    createGetOperationalSessionSliceByWallet({
      readSession: (walletAddress) =>
        operationalSessionRepository.findHistoryByWalletAddress(walletAddress),
      runtimeMaintenanceRepository,
      ...(input.getOperationalSessionByWalletDependencies?.now
        ? { now: input.getOperationalSessionByWalletDependencies.now }
        : {}),
      ...(input.getOperationalSessionByWalletDependencies?.degradedAfterMs
        ? {
            degradedAfterMs:
              input.getOperationalSessionByWalletDependencies.degradedAfterMs,
          }
        : {}),
      ...(input.getOperationalSessionByWalletDependencies?.errorAfterMs
        ? {
            errorAfterMs:
              input.getOperationalSessionByWalletDependencies.errorAfterMs,
          }
        : {}),
      synchronizePacificaAccountState,
      refreshPacificaAccountState: true,
    });
  const verifyPacificaOperational = createVerifyPacificaOperational({
    credentialRepository:
      input.verifyPacificaOperationalDependencies?.credentialRepository ??
      credentialRepository,
    credentialEncryption:
      input.verifyPacificaOperationalDependencies?.credentialEncryption ??
      credentialEncryption,
    operationalVerification:
      input.verifyPacificaOperationalDependencies?.operationalVerification ??
      new PacificaOperationalVerificationGateway(environment),
    eventRepository:
      input.verifyPacificaOperationalDependencies?.eventRepository ??
      defaultCredentialRepository,
  });

  const authRepository = new PrismaAuthRepository(input.prisma);
  const tokenService = new BearerTokenService(
    environment.credentialEncryptionKey,
  );
  const requestAuthNonce = createRequestAuthNonce({ authRepository });
  const verifyAuthSignature = createVerifyAuthSignature({
    authRepository,
    tokenService,
  });

  const validatePacificaCredentials = createValidatePacificaCredentials({
    credentialRepository,
    credentialEncryption,
    credentialValidation:
      input.validatePacificaCredentialsDependencies?.credentialValidation ??
      new PacificaCredentialValidationGateway(environment),
    createCredentialId:
      input.validatePacificaCredentialsDependencies?.createCredentialId ??
      (() => randomUUID()),
    eventRepository:
      input.validatePacificaCredentialsDependencies?.eventRepository ??
      defaultCredentialRepository,
  });

  return {
    name: "pacifica-api",
    environment,
    tokenService,
    router: createApiRouter({
      approvePacificaBuilder,
      activateYourStrategy,
      closeTrade,
      requestAuthNonce,
      previewYourStrategyBacktest,
      heartbeatRuntime,
      lookupOperationalAccountByWallet,
      pauseBot,
      reconcileRuntime,
      resumeBot,
      saveYourStrategy,
      getOperationalSessionByWallet,
      getOperationalProfileByWallet,
      getOperationalDashboardByWallet,
      getOperationalPresetsByWallet,
      getOperationalTradesByWallet,
      getOperationalHistoryByWallet,
      verifyAuthSignature,
      verifyPacificaOperational,
      validatePacificaCredentials,
    }),
  };
}
