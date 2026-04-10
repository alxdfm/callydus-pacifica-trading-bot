import {
  YOUR_STRATEGY_PRESET_DEFINITION_ID,
  createYourStrategyDraftFingerprint,
  type ActivateYourStrategyRequest,
  type ActivateYourStrategyResponse,
  type PresetEditableConfig,
} from "@pacifica/contracts";
import type { OperationalEventRepository } from "../../domain/operational-events/OperationalEventRepository";
import type { PacificaCredentialRepository } from "../../domain/pacifica-credentials/PacificaCredentialRepository";
import type { PresetActivationRepository } from "../../domain/preset-activations/PresetActivationRepository";
import type { YourStrategyRepository } from "../../domain/your-strategy/YourStrategyRepository";

export type ActivateYourStrategyDependencies = {
  credentialRepository: Pick<
    PacificaCredentialRepository,
    "findOperationalAccountByWalletAddress"
  >;
  yourStrategyRepository: YourStrategyRepository;
  presetActivationRepository: PresetActivationRepository;
  eventRepository?: OperationalEventRepository;
  now?: () => Date;
};

/**
 * Creates the activation use case for the account-scoped YOUR Strategy.
 *
 * Responsibility:
 * - validate operational readiness of the account
 * - require a successful backtest preview for the current saved draft
 * - activate the saved custom strategy through the existing preset runtime flow
 */
export function createActivateYourStrategy(
  dependencies: ActivateYourStrategyDependencies,
) {
  const getNow = dependencies.now ?? (() => new Date());

  /**
   * Activates the saved YOUR Strategy for a ready account.
   */
  return async function activateYourStrategy(
    input: ActivateYourStrategyRequest,
  ): Promise<ActivateYourStrategyResponse> {
    if (!input.walletAddress.trim()) {
      return {
        status: "error",
        code: "wallet_not_connected",
        message: "Connect the main wallet before activating YOUR Strategy.",
        retryable: false,
      };
    }

    const accountLookup =
      await dependencies.credentialRepository.findOperationalAccountByWalletAddress(
        input.walletAddress,
      );

    if (
      !accountLookup ||
      accountLookup.onboardingStatus !== "ready" ||
      !accountLookup.operationallyVerified
    ) {
      return {
        status: "error",
        code: "account_not_ready",
        message:
          "The account is not operationally ready to activate YOUR Strategy yet.",
        retryable: false,
      };
    }

    const strategy =
      await dependencies.yourStrategyRepository.findYourStrategyByWalletAddress(
        input.walletAddress,
      );

    if (!strategy) {
      return {
        status: "error",
        code: "strategy_not_found",
        message: "Save YOUR Strategy before trying to activate it.",
        retryable: false,
      };
    }

    if (
      strategy.materializedTechnicalContract === null ||
      strategy.activationBlockers.length > 0
    ) {
      return {
        status: "error",
        code: "strategy_not_executable",
        message: "YOUR Strategy must be executable before activation.",
        retryable: false,
        activationBlockers: strategy.activationBlockers,
      };
    }

    const fingerprint = createYourStrategyDraftFingerprint(strategy.draft);

    if (
      !strategy.lastBacktestPreviewedAt ||
      strategy.lastBacktestPreviewFingerprint !== fingerprint
    ) {
      return {
        status: "error",
        code: "backtest_required",
        message:
          "Run a successful backtest preview for the current YOUR Strategy before activation.",
        retryable: false,
      };
    }

    const editableConfig: PresetEditableConfig = {
      symbol: strategy.draft.symbol,
      positionSizeType: strategy.draft.positionSizeType,
      positionSizeValue: strategy.draft.positionSizeValue,
      longEnabled: strategy.draft.entry.long.enabled,
      shortEnabled: strategy.draft.entry.short.enabled,
    };

    const activatedPreset =
      await dependencies.presetActivationRepository.activatePreset({
        walletAddress: input.walletAddress,
        presetDefinitionId: YOUR_STRATEGY_PRESET_DEFINITION_ID,
        editableConfig,
        effectiveContract: strategy.materializedTechnicalContract,
        requestedBy: "app",
        nowIso: getNow().toISOString(),
      });

    if (!activatedPreset) {
      return {
        status: "error",
        code: "internal_error",
        message: "YOUR Strategy could not be activated right now.",
        retryable: true,
      };
    }

    await dependencies.eventRepository?.appendOperationalEvent({
      walletAddress: input.walletAddress,
      eventType: "preset_activation",
      severity: "info",
      title: "YOUR Strategy activated",
      message: `YOUR Strategy was activated for ${strategy.draft.symbol}.`,
      payloadJson: {
        presetDefinitionId: YOUR_STRATEGY_PRESET_DEFINITION_ID,
        strategyId: strategy.id,
        symbol: strategy.draft.symbol,
        backtestPreviewedAt: strategy.lastBacktestPreviewedAt,
      },
    });

    return {
      status: "success",
      activation: activatedPreset.activation,
      runtime: activatedPreset.runtime,
      message: "YOUR Strategy activated successfully.",
    };
  };
}
