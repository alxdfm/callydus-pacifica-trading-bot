import {
  presetActivationRequestSchema,
  presetActivationResponseSchema,
  type PresetActivationRequest,
  type PresetActivationResponse,
} from "@pacifica/contracts";

type ActivatePresetHttpRequest = {
  body: PresetActivationRequest;
};

export type ActivatePresetHandler = (
  input: PresetActivationRequest,
) => Promise<PresetActivationResponse>;

export function createActivatePresetRoute(handler: ActivatePresetHandler) {
  return async function handleActivatePreset(
    request: ActivatePresetHttpRequest,
  ): Promise<PresetActivationResponse> {
    const body = presetActivationRequestSchema.parse(request.body);
    const result = await handler(body);
    return presetActivationResponseSchema.parse(result);
  };
}
