import {
  presetActivationRequestSchema,
  presetActivationSchema,
  type PresetActivation,
  type PresetActivationRequest,
} from "@pacifica/contracts";

const demoOperatorAccountId = "00000000-0000-0000-0000-000000000001";

export type PresetActivationResult = {
  activation: PresetActivation;
  message: string;
};

export async function activatePresetLocally(
  request: PresetActivationRequest,
  operatorAccountId?: string | null,
): Promise<PresetActivationResult> {
  const parsedRequest = presetActivationRequestSchema.parse(request);

  await new Promise((resolve) => window.setTimeout(resolve, 700));

  const activation = presetActivationSchema.parse({
    id: crypto.randomUUID(),
    operatorAccountId: operatorAccountId ?? demoOperatorAccountId,
    presetDefinitionId: parsedRequest.presetDefinitionId,
    activationStatus: "active",
    editableConfig: parsedRequest.editableConfig,
    activatedAt: new Date().toISOString(),
    deactivatedAt: null,
  });

  return {
    activation,
    message: "Preset activated successfully.",
  };
}
