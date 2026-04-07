import {
  getPresetTechnicalContractByDefinitionId,
  type PresetActivationRequest,
  type PresetActivationResponse,
} from "@pacifica/contracts";
import { materializeEffectivePresetContract } from "@pacifica/preset-engine";
import type { OperationalEventRepository } from "../../domain/operational-events/OperationalEventRepository";
import type { PacificaCredentialRepository } from "../../domain/pacifica-credentials/PacificaCredentialRepository";
import type { PresetActivationRepository } from "../../domain/preset-activations/PresetActivationRepository";

export type ActivatePresetDependencies = {
  credentialRepository: Pick<
    PacificaCredentialRepository,
    "findOperationalAccountByWalletAddress"
  >;
  presetActivationRepository: PresetActivationRepository;
  eventRepository?: OperationalEventRepository;
  now?: () => Date;
};

/**
 * Creates the preset activation use case.
 *
 * Responsibility:
 * - validate whether the wallet is operationally ready
 * - materialize the effective preset contract from the editable config
 * - delegate persistence/activation to the repository layer
 */
export function createActivatePreset(
  dependencies: ActivatePresetDependencies,
) {
  const getNow = dependencies.now ?? (() => new Date());

  /**
   * Activates a preset for a ready operational account.
   */
  return async function activatePreset(
    input: PresetActivationRequest,
  ): Promise<PresetActivationResponse> {
    if (!input.walletAddress.trim()) {
      return {
        status: "error",
        code: "wallet_not_connected",
        message: "Connect the main wallet before activating a preset.",
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
          "The account is not operationally ready to activate a preset yet.",
        retryable: false,
      };
    }

    const baseContract = getPresetTechnicalContractByDefinitionId(
      input.presetDefinitionId,
    );

    if (!baseContract) {
      return {
        status: "error",
        code: "preset_not_found",
        message: "Preset technical contract not found.",
        retryable: false,
      };
    }

    const effectiveContract = materializeEffectivePresetContract(
      baseContract,
      input.editableConfig,
    );

    const activatedPreset =
      await dependencies.presetActivationRepository.activatePreset({
        walletAddress: input.walletAddress,
        presetDefinitionId: input.presetDefinitionId,
        editableConfig: input.editableConfig,
        effectiveContract,
        requestedBy: "app",
        nowIso: getNow().toISOString(),
      });

    if (!activatedPreset) {
      return {
        status: "error",
        code: "account_not_ready",
        message:
          "Could not resolve the operational account for this wallet address.",
        retryable: false,
      };
    }

    await dependencies.eventRepository?.appendOperationalEvent({
      walletAddress: input.walletAddress,
      eventType: "preset_activation",
      severity: "info",
      title: "Preset activated",
      message: `Preset ${activatedPreset.activation.presetDefinitionId} was activated for ${input.editableConfig.symbol}.`,
      payloadJson: {
        presetDefinitionId: activatedPreset.activation.presetDefinitionId,
        symbol: input.editableConfig.symbol,
        editableConfig: input.editableConfig,
      },
    });

    return {
      status: "success",
      activation: activatedPreset.activation,
      runtime: activatedPreset.runtime,
      message: "Preset activated successfully.",
    };
  };
}
