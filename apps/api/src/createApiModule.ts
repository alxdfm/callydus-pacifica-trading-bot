import type {
  DashboardContract,
  HistoryContract,
  OnboardingContract,
  PresetCatalogContract,
} from "@pacifica/contracts";
import type { PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";

import {
  createApprovePacificaBuilder,
  type ApprovePacificaBuilderDependencies,
} from "./application/approve-pacifica-builder/ApprovePacificaBuilder";
import {
  createActivatePreset,
  type ActivatePresetDependencies,
} from "./application/activate-preset/ActivatePreset";
import {
  createCloseTrade,
  type CloseTradeDependencies,
} from "./application/close-trade/CloseTrade";
import {
  createEvaluatePresetSignal,
  type EvaluatePresetSignalDependencies,
} from "./application/evaluate-preset-signal/EvaluatePresetSignal";
import {
  createGetMarketCandles,
  type GetMarketCandlesDependencies,
} from "./application/get-market-candles/GetMarketCandles";
import {
  createGetMarketPrices,
  type GetMarketPricesDependencies,
} from "./application/get-market-prices/GetMarketPrices";
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
import {
  createSynchronizePacificaAccountState,
  type SynchronizePacificaAccountStateDependencies,
} from "./application/synchronize-pacifica-account-state/SynchronizePacificaAccountState";
import {
  createPauseBot,
  type PauseBotDependencies,
} from "./application/pause-bot/PauseBot";
import {
  createReconcileRuntime,
  type ReconcileRuntimeDependencies,
} from "./application/reconcile-runtime/ReconcileRuntime";
import {
  createResumeBot,
  type ResumeBotDependencies,
} from "./application/resume-bot/ResumeBot";
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
import { PacificaMarketDataGateway } from "./infrastructure/pacifica/PacificaMarketDataGateway";
import { PacificaOperationalVerificationGateway } from "./infrastructure/pacifica/PacificaOperationalVerificationGateway";
import { PrismaPacificaCredentialRepository } from "./infrastructure/persistence/PrismaPacificaCredentialRepository";
import { createApiRouter } from "./ui/http/createApiRouter";

export type ApiReadModels = {
  onboarding: OnboardingContract;
  dashboard: DashboardContract;
  presets: PresetCatalogContract;
  history: HistoryContract;
};

export type CreateApiModuleInput = {
  environment?: Partial<ApiEnvironment>;
  prisma: PrismaClient;
  approvePacificaBuilderDependencies?: Partial<
    ApprovePacificaBuilderDependencies
  >;
  activatePresetDependencies?: Partial<ActivatePresetDependencies>;
  closeTradeDependencies?: Partial<CloseTradeDependencies>;
  evaluatePresetSignalDependencies?: Partial<EvaluatePresetSignalDependencies>;
  getMarketCandlesDependencies?: Partial<GetMarketCandlesDependencies>;
  getMarketPricesDependencies?: Partial<GetMarketPricesDependencies>;
  heartbeatRuntimeDependencies?: Partial<HeartbeatRuntimeDependencies>;
  lookupOperationalAccountByWalletDependencies?: Partial<
    LookupOperationalAccountByWalletDependencies
  >;
  getOperationalSessionByWalletDependencies?: Partial<
    GetOperationalSessionByWalletDependencies
  >;
  synchronizePacificaAccountStateDependencies?: Partial<
    SynchronizePacificaAccountStateDependencies
  >;
  pauseBotDependencies?: Partial<PauseBotDependencies>;
  reconcileRuntimeDependencies?: Partial<ReconcileRuntimeDependencies>;
  resumeBotDependencies?: Partial<ResumeBotDependencies>;
  verifyPacificaOperationalDependencies?: Partial<
    VerifyPacificaOperationalDependencies
  >;
  validatePacificaCredentialsDependencies?: Partial<
    ValidatePacificaCredentialsDependencies
  >;
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
  const marketDataGateway = new PacificaMarketDataGateway(environment);
  const getMarketCandles = createGetMarketCandles({
    marketData:
      input.getMarketCandlesDependencies?.marketData ?? marketDataGateway,
  });
  const evaluatePresetSignal = createEvaluatePresetSignal({
    marketData:
      input.evaluatePresetSignalDependencies?.marketData ?? marketDataGateway,
    eventRepository:
      input.evaluatePresetSignalDependencies?.eventRepository ??
      defaultCredentialRepository,
    ...(input.evaluatePresetSignalDependencies?.now
      ? { now: input.evaluatePresetSignalDependencies.now }
      : {}),
  });
  const getMarketPrices = createGetMarketPrices({
    marketData:
      input.getMarketPricesDependencies?.marketData ?? marketDataGateway,
  });

  const activatePreset = createActivatePreset({
    credentialRepository:
      input.activatePresetDependencies?.credentialRepository ??
      defaultCredentialRepository,
    presetActivationRepository:
      input.activatePresetDependencies?.presetActivationRepository ??
      defaultCredentialRepository,
    eventRepository:
      input.activatePresetDependencies?.eventRepository ??
      defaultCredentialRepository,
    ...(input.activatePresetDependencies?.now
      ? { now: input.activatePresetDependencies.now }
      : {}),
  });
  const pauseBot = createPauseBot({
    commandRepository:
      input.pauseBotDependencies?.commandRepository ??
      defaultCredentialRepository,
    eventRepository:
      input.pauseBotDependencies?.eventRepository ?? defaultCredentialRepository,
    ...(input.pauseBotDependencies?.now
      ? { now: input.pauseBotDependencies.now }
      : {}),
  });
  const resumeBot = createResumeBot({
    commandRepository:
      input.resumeBotDependencies?.commandRepository ??
      defaultCredentialRepository,
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
      input.closeTradeDependencies?.eventRepository ?? defaultCredentialRepository,
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
  const synchronizePacificaAccountState = createSynchronizePacificaAccountState({
    pacificaAccountState:
      input.synchronizePacificaAccountStateDependencies?.pacificaAccountState ??
      new PacificaAccountStateGateway(environment),
    runtimeMaintenanceRepository:
      input.synchronizePacificaAccountStateDependencies
        ?.runtimeMaintenanceRepository ?? defaultCredentialRepository,
    ...(input.synchronizePacificaAccountStateDependencies?.now
      ? { now: input.synchronizePacificaAccountStateDependencies.now }
      : {}),
  });
  const getOperationalSessionByWallet = createGetOperationalSessionByWallet({
    operationalSessionRepository:
      input.getOperationalSessionByWalletDependencies
        ?.operationalSessionRepository ?? defaultCredentialRepository,
    runtimeMaintenanceRepository:
      input.getOperationalSessionByWalletDependencies
        ?.runtimeMaintenanceRepository ?? defaultCredentialRepository,
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
  });
  const credentialEncryption =
    input.validatePacificaCredentialsDependencies?.credentialEncryption ??
    new AesCredentialEncryptionService(
      environment.credentialEncryptionKey,
      environment.credentialEncryptionKeyId,
    );

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
    router: createApiRouter({
      approvePacificaBuilder,
      activatePreset,
      closeTrade,
      evaluatePresetSignal,
      getMarketCandles,
      getMarketPrices,
      heartbeatRuntime,
      lookupOperationalAccountByWallet,
      pauseBot,
      reconcileRuntime,
      resumeBot,
      getOperationalSessionByWallet,
      verifyPacificaOperational,
      validatePacificaCredentials,
    }),
  };
}
