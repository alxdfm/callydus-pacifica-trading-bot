import { createApprovePacificaBuilderRoute } from "./routes/createApprovePacificaBuilderRoute";
import type { ApprovePacificaBuilderHandler } from "./routes/createApprovePacificaBuilderRoute";
import { createValidatePacificaCredentialsRoute } from "./routes/createValidatePacificaCredentialsRoute";
import type { ValidatePacificaCredentialsHandler } from "./routes/createValidatePacificaCredentialsRoute";

export type ApiRouterDependencies = {
  approvePacificaBuilder: ApprovePacificaBuilderHandler;
  validatePacificaCredentials: ValidatePacificaCredentialsHandler;
};

export function createApiRouter(dependencies: ApiRouterDependencies) {
  return {
    approvePacificaBuilder: createApprovePacificaBuilderRoute(
      dependencies.approvePacificaBuilder,
    ),
    validatePacificaCredentials: createValidatePacificaCredentialsRoute(
      dependencies.validatePacificaCredentials,
    ),
  };
}
