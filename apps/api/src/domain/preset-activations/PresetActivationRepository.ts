import type {
  BotRuntimeState,
  PresetActivation,
  PresetEditableConfig,
  PresetTechnicalContract,
} from "@pacifica/contracts";

export type ActivatePresetInput = {
  walletAddress: string;
  presetDefinitionId: string;
  editableConfig: PresetEditableConfig;
  effectiveContract: PresetTechnicalContract;
  requestedBy: string;
  nowIso: string;
};

export type ActivatedPresetRecord = {
  activation: PresetActivation;
  runtime: BotRuntimeState;
};

export interface PresetActivationRepository {
  activatePreset(input: ActivatePresetInput): Promise<ActivatedPresetRecord | null>;
}
