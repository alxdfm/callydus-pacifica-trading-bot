import { createVerifyPacificaOperationalRoute } from "./routes/createVerifyPacificaOperationalRoute";
import type { VerifyPacificaOperationalHandler } from "./routes/createVerifyPacificaOperationalRoute";
import { createApprovePacificaBuilderRoute } from "./routes/createApprovePacificaBuilderRoute";
import type { ApprovePacificaBuilderHandler } from "./routes/createApprovePacificaBuilderRoute";
import { createLookupOperationalAccountByWalletRoute } from "./routes/createLookupOperationalAccountByWalletRoute";
import type { LookupOperationalAccountByWalletHandler } from "./routes/createLookupOperationalAccountByWalletRoute";
import { createGetOperationalSessionByWalletRoute } from "./routes/createGetOperationalSessionByWalletRoute";
import type { GetOperationalSessionByWalletHandler } from "./routes/createGetOperationalSessionByWalletRoute";
import { createValidatePacificaCredentialsRoute } from "./routes/createValidatePacificaCredentialsRoute";
import type { ValidatePacificaCredentialsHandler } from "./routes/createValidatePacificaCredentialsRoute";

export type ApiRouterDependencies = {
  approvePacificaBuilder: ApprovePacificaBuilderHandler;
  lookupOperationalAccountByWallet: LookupOperationalAccountByWalletHandler;
  getOperationalSessionByWallet: GetOperationalSessionByWalletHandler;
  validatePacificaCredentials: ValidatePacificaCredentialsHandler;
  verifyPacificaOperational: VerifyPacificaOperationalHandler;
};

export function createApiRouter(dependencies: ApiRouterDependencies) {
  return {
    approvePacificaBuilder: createApprovePacificaBuilderRoute(
      dependencies.approvePacificaBuilder,
    ),
    lookupOperationalAccountByWallet: createLookupOperationalAccountByWalletRoute(
      dependencies.lookupOperationalAccountByWallet,
    ),
    getOperationalSessionByWallet: createGetOperationalSessionByWalletRoute(
      dependencies.getOperationalSessionByWallet,
    ),
    verifyPacificaOperational: createVerifyPacificaOperationalRoute(
      dependencies.verifyPacificaOperational,
    ),
    validatePacificaCredentials: createValidatePacificaCredentialsRoute(
      dependencies.validatePacificaCredentials,
    ),
  };
}
