import {
  presetSignalEvaluationRequestSchema,
  presetSignalEvaluationResponseSchema,
  type PresetSignalEvaluationRequest,
  type PresetSignalEvaluationResponse,
} from "@pacifica/contracts";

type EvaluatePresetSignalHttpRequest = {
  body: PresetSignalEvaluationRequest;
};

export type EvaluatePresetSignalHandler = (
  input: PresetSignalEvaluationRequest,
) => Promise<PresetSignalEvaluationResponse>;

export function createEvaluatePresetSignalRoute(
  handler: EvaluatePresetSignalHandler,
) {
  return async function handleEvaluatePresetSignal(
    request: EvaluatePresetSignalHttpRequest,
  ): Promise<PresetSignalEvaluationResponse> {
    const body = presetSignalEvaluationRequestSchema.parse(request.body);
    const result = await handler(body);
    return presetSignalEvaluationResponseSchema.parse(result);
  };
}
