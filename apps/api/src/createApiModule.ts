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

  const validatePacificaCredentials = createValidatePacificaCredentials({
    credentialRepository:
      input.validatePacificaCredentialsDependencies?.credentialRepository ??
      new PrismaPacificaCredentialRepository(input.prisma),
    credentialEncryption:
      input.validatePacificaCredentialsDependencies?.credentialEncryption ??
      new AesCredentialEncryptionService(
        environment.credentialEncryptionKey,
        environment.credentialEncryptionKeyId,
      ),
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
      validatePacificaCredentials,
    }),
  };
}
