import {
  presetBacktestPreviewRequestSchema,
  presetBacktestPreviewResponseSchema,
  type PresetBacktestPreviewRequest,
  type PresetBacktestPreviewResponse,
} from "@pacifica/contracts";

type PreviewPresetBacktestHttpRequest = {
  body: PresetBacktestPreviewRequest;
};

export type PreviewPresetBacktestHandler = (
  input: PresetBacktestPreviewRequest,
) => Promise<PresetBacktestPreviewResponse>;

export function createPreviewPresetBacktestRoute(
  handler: PreviewPresetBacktestHandler,
) {
  return async function handlePreviewPresetBacktest(
    request: PreviewPresetBacktestHttpRequest,
  ): Promise<PresetBacktestPreviewResponse> {
    const body = presetBacktestPreviewRequestSchema.parse(request.body);
    const result = await handler(body);
    return presetBacktestPreviewResponseSchema.parse(result);
  };
}
