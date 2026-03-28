import { createGetMarketCandlesRoute } from "./routes/createGetMarketCandlesRoute";
import { createEvaluatePresetSignalRoute } from "./routes/createEvaluatePresetSignalRoute";
import type { EvaluatePresetSignalHandler } from "./routes/createEvaluatePresetSignalRoute";
import type { GetMarketCandlesHandler } from "./routes/createGetMarketCandlesRoute";
import { createGetMarketPricesRoute } from "./routes/createGetMarketPricesRoute";
import type { GetMarketPricesHandler } from "./routes/createGetMarketPricesRoute";
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
  evaluatePresetSignal: EvaluatePresetSignalHandler;
  getMarketCandles: GetMarketCandlesHandler;
  getMarketPrices: GetMarketPricesHandler;
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
    evaluatePresetSignal: createEvaluatePresetSignalRoute(
      dependencies.evaluatePresetSignal,
    ),
    getMarketCandles: createGetMarketCandlesRoute(
      dependencies.getMarketCandles,
    ),
    getMarketPrices: createGetMarketPricesRoute(
      dependencies.getMarketPrices,
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
