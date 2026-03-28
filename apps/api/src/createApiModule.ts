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
  createLookupOperationalAccountByWallet,
  type LookupOperationalAccountByWalletDependencies,
} from "./application/lookup-operational-account-by-wallet/LookupOperationalAccountByWallet";
import {
  createGetOperationalSessionByWallet,
  type GetOperationalSessionByWalletDependencies,
} from "./application/get-operational-session-by-wallet/GetOperationalSessionByWallet";
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
  evaluatePresetSignalDependencies?: Partial<EvaluatePresetSignalDependencies>;
  getMarketCandlesDependencies?: Partial<GetMarketCandlesDependencies>;
  getMarketPricesDependencies?: Partial<GetMarketPricesDependencies>;
  lookupOperationalAccountByWalletDependencies?: Partial<
    LookupOperationalAccountByWalletDependencies
  >;
  getOperationalSessionByWalletDependencies?: Partial<
    GetOperationalSessionByWalletDependencies
  >;
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
  const marketDataGateway = new PacificaMarketDataGateway(environment);
  const getMarketCandles = createGetMarketCandles({
    marketData:
      input.getMarketCandlesDependencies?.marketData ?? marketDataGateway,
  });
  const evaluatePresetSignal = createEvaluatePresetSignal({
    marketData:
      input.evaluatePresetSignalDependencies?.marketData ?? marketDataGateway,
    ...(input.evaluatePresetSignalDependencies?.now
      ? { now: input.evaluatePresetSignalDependencies.now }
      : {}),
  });
  const getMarketPrices = createGetMarketPrices({
    marketData:
      input.getMarketPricesDependencies?.marketData ?? marketDataGateway,
  });

  const defaultCredentialRepository = new PrismaPacificaCredentialRepository(
    input.prisma,
  );
  const credentialRepository =
    input.validatePacificaCredentialsDependencies?.credentialRepository ??
    defaultCredentialRepository;
  const lookupOperationalAccountByWallet =
    createLookupOperationalAccountByWallet({
      credentialRepository:
        input.lookupOperationalAccountByWalletDependencies
          ?.credentialRepository ?? credentialRepository,
    });
  const getOperationalSessionByWallet = createGetOperationalSessionByWallet({
    operationalSessionRepository:
      input.getOperationalSessionByWalletDependencies
        ?.operationalSessionRepository ?? defaultCredentialRepository,
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
  });

  return {
    name: "pacifica-api",
    environment,
    router: createApiRouter({
      approvePacificaBuilder,
      evaluatePresetSignal,
      getMarketCandles,
      getMarketPrices,
      lookupOperationalAccountByWallet,
      getOperationalSessionByWallet,
      verifyPacificaOperational,
      validatePacificaCredentials,
    }),
  };
}
