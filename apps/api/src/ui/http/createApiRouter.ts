import { createActivateYourStrategyRoute } from "./routes/createActivateYourStrategyRoute";
import type { ActivateYourStrategyHandler } from "./routes/createActivateYourStrategyRoute";
import { createCloseTradeRoute } from "./routes/createCloseTradeRoute";
import type { CloseTradeHandler } from "./routes/createCloseTradeRoute";
import { createGetMarketCandlesRoute } from "./routes/createGetMarketCandlesRoute";
import type { GetMarketCandlesHandler } from "./routes/createGetMarketCandlesRoute";
import { createGetMarketPricesRoute } from "./routes/createGetMarketPricesRoute";
import type { GetMarketPricesHandler } from "./routes/createGetMarketPricesRoute";
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
import { createGetOperationalProfileByWalletRoute } from "./routes/createGetOperationalProfileByWalletRoute";
import type { GetOperationalProfileByWalletHandler } from "./routes/createGetOperationalProfileByWalletRoute";
import { createGetOperationalDashboardByWalletRoute } from "./routes/createGetOperationalDashboardByWalletRoute";
import type { GetOperationalDashboardByWalletHandler } from "./routes/createGetOperationalDashboardByWalletRoute";
import { createGetOperationalPresetsByWalletRoute } from "./routes/createGetOperationalPresetsByWalletRoute";
import type { GetOperationalPresetsByWalletHandler } from "./routes/createGetOperationalPresetsByWalletRoute";
import { createGetOperationalTradesByWalletRoute } from "./routes/createGetOperationalTradesByWalletRoute";
import type { GetOperationalTradesByWalletHandler } from "./routes/createGetOperationalTradesByWalletRoute";
import { createGetOperationalHistoryByWalletRoute } from "./routes/createGetOperationalHistoryByWalletRoute";
import type { GetOperationalHistoryByWalletHandler } from "./routes/createGetOperationalHistoryByWalletRoute";
import { createValidatePacificaCredentialsRoute } from "./routes/createValidatePacificaCredentialsRoute";
import type { ValidatePacificaCredentialsHandler } from "./routes/createValidatePacificaCredentialsRoute";
import { createRefreshMarketDataRoute } from "./routes/createRefreshMarketDataRoute";
import type { RefreshMarketDataHandler } from "./routes/createRefreshMarketDataRoute";
import { createSaveYourStrategyRoute } from "./routes/createSaveYourStrategyRoute";
import type { SaveYourStrategyHandler } from "./routes/createSaveYourStrategyRoute";

type ApiRouterDependencies = {
  activateYourStrategy: ActivateYourStrategyHandler;
  approvePacificaBuilder: ApprovePacificaBuilderHandler;
  closeTrade: CloseTradeHandler;
  getMarketCandles: GetMarketCandlesHandler;
  getMarketPrices: GetMarketPricesHandler;
  previewYourStrategyBacktest: PreviewYourStrategyBacktestHandler;
  heartbeatRuntime: HeartbeatRuntimeHandler;
  lookupOperationalAccountByWallet: LookupOperationalAccountByWalletHandler;
  pauseBot: PauseBotHandler;
  reconcileRuntime: ReconcileRuntimeHandler;
  resumeBot: ResumeBotHandler;
  getOperationalSessionByWallet: GetOperationalSessionByWalletHandler;
  getOperationalProfileByWallet: GetOperationalProfileByWalletHandler;
  getOperationalDashboardByWallet: GetOperationalDashboardByWalletHandler;
  getOperationalPresetsByWallet: GetOperationalPresetsByWalletHandler;
  getOperationalTradesByWallet: GetOperationalTradesByWalletHandler;
  getOperationalHistoryByWallet: GetOperationalHistoryByWalletHandler;
  refreshMarketData: RefreshMarketDataHandler;
  saveYourStrategy: SaveYourStrategyHandler;
  validatePacificaCredentials: ValidatePacificaCredentialsHandler;
  verifyPacificaOperational: VerifyPacificaOperationalHandler;
};

export function createApiRouter(dependencies: ApiRouterDependencies) {
  return {
    activateYourStrategy: createActivateYourStrategyRoute(
      dependencies.activateYourStrategy,
    ),
    approvePacificaBuilder: createApprovePacificaBuilderRoute(
      dependencies.approvePacificaBuilder,
    ),
    closeTrade: createCloseTradeRoute(dependencies.closeTrade),
    getMarketCandles: createGetMarketCandlesRoute(
      dependencies.getMarketCandles,
    ),
    getMarketPrices: createGetMarketPricesRoute(
      dependencies.getMarketPrices,
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
    getOperationalProfileByWallet: createGetOperationalProfileByWalletRoute(
      dependencies.getOperationalProfileByWallet,
    ),
    getOperationalDashboardByWallet: createGetOperationalDashboardByWalletRoute(
      dependencies.getOperationalDashboardByWallet,
    ),
    getOperationalPresetsByWallet: createGetOperationalPresetsByWalletRoute(
      dependencies.getOperationalPresetsByWallet,
    ),
    getOperationalTradesByWallet: createGetOperationalTradesByWalletRoute(
      dependencies.getOperationalTradesByWallet,
    ),
    getOperationalHistoryByWallet: createGetOperationalHistoryByWalletRoute(
      dependencies.getOperationalHistoryByWallet,
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
