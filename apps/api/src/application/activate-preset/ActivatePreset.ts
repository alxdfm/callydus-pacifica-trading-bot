import {
  getPresetTechnicalContractByDefinitionId,
  type PresetActivationRequest,
  type PresetActivationResponse,
} from "@pacifica/contracts";
import type { PacificaCredentialRepository } from "../../domain/pacifica-credentials/PacificaCredentialRepository";
import type { PresetActivationRepository } from "../../domain/preset-activations/PresetActivationRepository";

export type ActivatePresetDependencies = {
  credentialRepository: Pick<
    PacificaCredentialRepository,
    "findOperationalAccountByWalletAddress"
  >;
  presetActivationRepository: PresetActivationRepository;
  now?: () => Date;
};

export function createActivatePreset(
  dependencies: ActivatePresetDependencies,
) {
  const getNow = dependencies.now ?? (() => new Date());

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

    const effectiveContract = {
      ...baseContract,
      symbol: input.editableConfig.symbol,
      entry: {
        ...baseContract.entry,
        long: {
          ...baseContract.entry.long,
          enabled: input.editableConfig.longEnabled,
        },
        short: {
          ...baseContract.entry.short,
          enabled: input.editableConfig.shortEnabled,
        },
      },
      execution: {
        ...baseContract.execution,
        positionSize: {
          ...baseContract.execution.positionSize,
          value: input.editableConfig.positionSizeValue,
        },
      },
    } as const;

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

    return {
      status: "success",
      activation: activatedPreset.activation,
      runtime: activatedPreset.runtime,
      message: "Preset activated successfully.",
    };
  };
}
