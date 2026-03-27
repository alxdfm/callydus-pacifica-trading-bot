import { createVerifyPacificaOperationalRoute } from "./routes/createVerifyPacificaOperationalRoute";
import type { VerifyPacificaOperationalHandler } from "./routes/createVerifyPacificaOperationalRoute";
import { createApprovePacificaBuilderRoute } from "./routes/createApprovePacificaBuilderRoute";
import type { ApprovePacificaBuilderHandler } from "./routes/createApprovePacificaBuilderRoute";
import { createLookupOperationalAccountByWalletRoute } from "./routes/createLookupOperationalAccountByWalletRoute";
import type { LookupOperationalAccountByWalletHandler } from "./routes/createLookupOperationalAccountByWalletRoute";
import { createValidatePacificaCredentialsRoute } from "./routes/createValidatePacificaCredentialsRoute";
import type { ValidatePacificaCredentialsHandler } from "./routes/createValidatePacificaCredentialsRoute";

export type ApiRouterDependencies = {
  approvePacificaBuilder: ApprovePacificaBuilderHandler;
  lookupOperationalAccountByWallet: LookupOperationalAccountByWalletHandler;
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
    verifyPacificaOperational: createVerifyPacificaOperationalRoute(
      dependencies.verifyPacificaOperational,
    ),
    validatePacificaCredentials: createValidatePacificaCredentialsRoute(
      dependencies.validatePacificaCredentials,
    ),
  };
}
