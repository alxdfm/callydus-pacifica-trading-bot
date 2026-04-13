import type { CredentialEncryptionPort } from "../../domain/pacifica-credentials/CredentialEncryptionPort";
import type { OperationalEventRepository } from "../../domain/operational-events/OperationalEventRepository";
import type { PacificaCredentialRepository } from "../../domain/pacifica-credentials/PacificaCredentialRepository";
import type { OperationalSessionRepository } from "../../domain/operational-session/OperationalSession";

type StartBotReadinessCheckInput = {
  walletAddress: string;
};

export type StartBotReadinessCheckResult = {
  symbol: string;
  marketDisplaySymbol: string;
  marginMode: "cross" | "isolated";
  leverageUsed: number;
  leverageConfiguredByUser: number | null;
  availableBalanceUsed: number;
  positionSizeType: "fixed_amount" | "balance_percent";
  positionSizeValue: number;
  targetInitialMarginUsd: number;
  targetNotionalUsd: number;
  marketMinOrderSizeUsd: number;
  marketMaxLeverage: number;
  referencePrice: number;
  probeLimitPrice: number | null;
  normalizedAmount: string | null;
  probeClientOrderId: string | null;
  probeExecuted: boolean;
};

export type StartBotReadinessCheckResponse =
  | {
      status: "success";
      readinessStatus: "passed";
      message: string;
      result: StartBotReadinessCheckResult;
    }
  | {
      status: "error";
      readinessStatus: "blocked" | "error";
      code:
        | "wallet_not_connected"
        | "account_not_ready"
        | "active_preset_not_found"
        | "market_not_found"
        | "account_settings_unavailable"
        | "leverage_not_configured"
        | "invalid_leverage_configuration"
        | "trade_below_market_minimum"
        | "trade_above_market_maximum"
        | "leverage_above_market_maximum"
        | "insufficient_margin"
        | "signature_rejected"
        | "agent_wallet_unauthorized_for_account"
        | "provider_unavailable"
        | "rate_limited"
        | "internal_error";
      message: string;
      retryable: boolean;
      result?: StartBotReadinessCheckResult | null;
    };

export type StartBotReadinessCheckDependencies = {
  sessionRepository: OperationalSessionRepository;
  credentialRepository: Pick<
    PacificaCredentialRepository,
    "findById" | "upsertSymbolOperationalConfig"
  >;
  credentialEncryption: CredentialEncryptionPort;
  startBotReadiness: {
    runCheck(input: {
      walletAddress: string;
      agentWalletPublicKey: string;
      agentWalletPrivateKey: string;
      displaySymbol: string;
      positionSizeType: "fixed_amount" | "balance_percent";
      positionSizeValue: number;
      configuredLeverage: number | null;
      prices?: Array<{ symbol: string; markPrice: number }>;
    }): Promise<StartBotReadinessCheckResponse>;
  };
  marketData?: {
    getPrices(): Promise<Array<{ symbol: string; markPrice: number }>>;
  };
  eventRepository?: OperationalEventRepository;
};

export function createStartBotReadinessCheck(
  dependencies: StartBotReadinessCheckDependencies,
) {
  return async function startBotReadinessCheck(
    input: StartBotReadinessCheckInput,
  ): Promise<StartBotReadinessCheckResponse> {
    if (!input.walletAddress.trim()) {
      return {
        status: "error",
        readinessStatus: "error",
        code: "wallet_not_connected",
        message: "Connect the main wallet before starting the bot.",
        retryable: false,
      };
    }

    const session = await dependencies.sessionRepository.findByWalletAddress(
      input.walletAddress,
    );

    if (!session || !session.canAccessProduct) {
      return {
        status: "error",
        readinessStatus: "blocked",
        code: "account_not_ready",
        message: "The account is not ready to start the bot.",
        retryable: false,
      };
    }

    if (!session.activePreset) {
      return {
        status: "error",
        readinessStatus: "blocked",
        code: "active_preset_not_found",
        message: "Activate a preset before starting the bot.",
        retryable: false,
      };
    }

    if (!session.credentialId || !session.agentWalletPublicKey) {
      return {
        status: "error",
        readinessStatus: "blocked",
        code: "account_not_ready",
        message: "No active Agent Wallet is available for this account.",
        retryable: false,
      };
    }

    const symbolConfig = session.runtime.symbolOperationalConfigs.find(
      (config) => config.symbol === session.activePreset?.editableConfig.symbol,
    );

    const credential = await dependencies.credentialRepository.findById(
      session.credentialId,
      input.walletAddress,
    );

    if (!credential) {
      return {
        status: "error",
        readinessStatus: "blocked",
        code: "account_not_ready",
        message: "Could not resolve the active credential for this account.",
        retryable: false,
      };
    }

    const agentWalletPrivateKey =
      await dependencies.credentialEncryption.decryptAgentWalletPrivateKey({
        encryptedPrivateKeyRef: credential.encryptedPrivateKeyRef,
      });

    let prices: Array<{ symbol: string; markPrice: number }> | undefined;
    if (dependencies.marketData) {
      try {
        prices = await dependencies.marketData.getPrices();
      } catch {
        // fallback: gateway will fetch prices directly from provider
      }
    }

    const result = await dependencies.startBotReadiness.runCheck({
      walletAddress: session.walletAddress,
      agentWalletPublicKey: session.agentWalletPublicKey,
      agentWalletPrivateKey,
      displaySymbol: session.activePreset.editableConfig.symbol,
      positionSizeType: session.activePreset.editableConfig.positionSizeType,
      positionSizeValue: session.activePreset.editableConfig.positionSizeValue,
      configuredLeverage: symbolConfig?.leverage ?? null,
      ...(prices ? { prices } : {}),
    });

    if (result.result) {
      await dependencies.credentialRepository.upsertSymbolOperationalConfig({
        walletAddress: session.walletAddress,
        config: {
          symbol: session.activePreset.editableConfig.symbol,
          leverage: result.result.leverageUsed,
        },
      });
    }

    await dependencies.eventRepository?.appendOperationalEvent({
      walletAddress: session.walletAddress,
      eventType: "bot_command",
      severity: result.status === "success" ? "info" : "warning",
      title: "Start bot readiness check",
      message: result.message,
      payloadJson: {
        readinessStatus: result.readinessStatus,
        ...(result.status === "error" ? { code: result.code } : {}),
        result: "result" in result ? result.result : null,
      },
    });

    return result;
  };
}
