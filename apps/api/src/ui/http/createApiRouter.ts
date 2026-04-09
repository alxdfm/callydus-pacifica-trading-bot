import { createActivatePresetRoute } from "./routes/createActivatePresetRoute";
import type { ActivatePresetHandler } from "./routes/createActivatePresetRoute";
import { createCloseTradeRoute } from "./routes/createCloseTradeRoute";
import type { CloseTradeHandler } from "./routes/createCloseTradeRoute";
import { createGetMarketCandlesRoute } from "./routes/createGetMarketCandlesRoute";
import { createEvaluatePresetSignalRoute } from "./routes/createEvaluatePresetSignalRoute";
import type { EvaluatePresetSignalHandler } from "./routes/createEvaluatePresetSignalRoute";
import type { GetMarketCandlesHandler } from "./routes/createGetMarketCandlesRoute";
import { createGetMarketPricesRoute } from "./routes/createGetMarketPricesRoute";
import type { GetMarketPricesHandler } from "./routes/createGetMarketPricesRoute";
import { createGetMarketInfoRoute } from "./routes/createGetMarketInfoRoute";
import type { GetMarketInfoHandler } from "./routes/createGetMarketInfoRoute";
import { createGetYourStrategyRoute } from "./routes/createGetYourStrategyRoute";
import type { GetYourStrategyHandler } from "./routes/createGetYourStrategyRoute";
import { createPreviewPresetBacktestRoute } from "./routes/createPreviewPresetBacktestRoute";
import type { PreviewPresetBacktestHandler } from "./routes/createPreviewPresetBacktestRoute";
import { createPreviewYourStrategyBacktestRoute } from "./routes/createPreviewYourStrategyBacktestRoute";
import type { PreviewYourStrategyBacktestHandler } from "./routes/createPreviewYourStrategyBacktestRoute";
import { createPauseBotRoute } from "./routes/createPauseBotRoute";
import type { PauseBotHandler } from "./routes/createPauseBotRoute";
import { createHeartbeatRuntimeRoute } from "./routes/createHeartbeatRuntimeRoute";
import type { HeartbeatRuntimeHandler } from "./routes/createHeartbeatRuntimeRoute";
import { createReconcileRuntimeRoute } from "./routes/createReconcileRuntimeRoute";
import type { ReconcileRuntimeHandler } from "./routes/createReconcileRuntimeRoute";
import { createResumeBotRoute } from "./routes/createResumeBotRoute";
import type { ResumeBotHandler } from "./routes/createResumeBotRoute";
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
import { createRefreshMarketDataRoute } from "./routes/createRefreshMarketDataRoute";
import type { RefreshMarketDataHandler } from "./routes/createRefreshMarketDataRoute";
import { createSaveYourStrategyRoute } from "./routes/createSaveYourStrategyRoute";
import type { SaveYourStrategyHandler } from "./routes/createSaveYourStrategyRoute";

type ApiRouterDependencies = {
  activatePreset: ActivatePresetHandler;
  approvePacificaBuilder: ApprovePacificaBuilderHandler;
  closeTrade: CloseTradeHandler;
  evaluatePresetSignal: EvaluatePresetSignalHandler;
  getMarketCandles: GetMarketCandlesHandler;
  getMarketInfo: GetMarketInfoHandler;
  getMarketPrices: GetMarketPricesHandler;
  getYourStrategy: GetYourStrategyHandler;
  previewPresetBacktest: PreviewPresetBacktestHandler;
  previewYourStrategyBacktest: PreviewYourStrategyBacktestHandler;
  heartbeatRuntime: HeartbeatRuntimeHandler;
  lookupOperationalAccountByWallet: LookupOperationalAccountByWalletHandler;
  pauseBot: PauseBotHandler;
  reconcileRuntime: ReconcileRuntimeHandler;
  resumeBot: ResumeBotHandler;
  getOperationalSessionByWallet: GetOperationalSessionByWalletHandler;
  refreshMarketData: RefreshMarketDataHandler;
  saveYourStrategy: SaveYourStrategyHandler;
  validatePacificaCredentials: ValidatePacificaCredentialsHandler;
  verifyPacificaOperational: VerifyPacificaOperationalHandler;
};

export function createApiRouter(dependencies: ApiRouterDependencies) {
  return {
    activatePreset: createActivatePresetRoute(dependencies.activatePreset),
    approvePacificaBuilder: createApprovePacificaBuilderRoute(
      dependencies.approvePacificaBuilder,
    ),
    closeTrade: createCloseTradeRoute(dependencies.closeTrade),
    evaluatePresetSignal: createEvaluatePresetSignalRoute(
      dependencies.evaluatePresetSignal,
    ),
    getMarketCandles: createGetMarketCandlesRoute(
      dependencies.getMarketCandles,
    ),
    getMarketInfo: createGetMarketInfoRoute(dependencies.getMarketInfo),
    getMarketPrices: createGetMarketPricesRoute(
      dependencies.getMarketPrices,
    ),
    getYourStrategy: createGetYourStrategyRoute(
      dependencies.getYourStrategy,
    ),
    previewPresetBacktest: createPreviewPresetBacktestRoute(
      dependencies.previewPresetBacktest,
    ),
    previewYourStrategyBacktest: createPreviewYourStrategyBacktestRoute(
      dependencies.previewYourStrategyBacktest,
    ),
    heartbeatRuntime: createHeartbeatRuntimeRoute(
      dependencies.heartbeatRuntime,
    ),
    lookupOperationalAccountByWallet: createLookupOperationalAccountByWalletRoute(
      dependencies.lookupOperationalAccountByWallet,
    ),
    pauseBot: createPauseBotRoute(dependencies.pauseBot),
    reconcileRuntime: createReconcileRuntimeRoute(
      dependencies.reconcileRuntime,
    ),
    resumeBot: createResumeBotRoute(dependencies.resumeBot),
    getOperationalSessionByWallet: createGetOperationalSessionByWalletRoute(
      dependencies.getOperationalSessionByWallet,
    ),
    refreshMarketData: createRefreshMarketDataRoute(
      dependencies.refreshMarketData,
    ),
    saveYourStrategy: createSaveYourStrategyRoute(
      dependencies.saveYourStrategy,
    ),
    verifyPacificaOperational: createVerifyPacificaOperationalRoute(
      dependencies.verifyPacificaOperational,
    ),
    validatePacificaCredentials: createValidatePacificaCredentialsRoute(
      dependencies.validatePacificaCredentials,
    ),
  };
}
