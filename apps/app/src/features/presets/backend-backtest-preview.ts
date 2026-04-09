import {
  presetBacktestPreviewResponseSchema,
  type PresetBacktestPreviewRequest,
  type PresetBacktestPreviewResponse,
} from "@pacifica/contracts";
import { parseJsonResponse } from "../onboarding/backend-response";

const defaultApiBaseUrl = "http://localhost:3003";

export async function previewPresetBacktestViaBackend(
  request: PresetBacktestPreviewRequest,
): Promise<PresetBacktestPreviewResponse> {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_APP_API_BASE_URL ?? defaultApiBaseUrl}/api/presets/backtest-preview`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      },
    );

    return presetBacktestPreviewResponseSchema.parse(
      await parseJsonResponse(response),
    );
  } catch {
    return presetBacktestPreviewResponseSchema.parse({
      status: "error",
      code: "internal_error",
      message: "Preset backtest preview is temporarily unavailable.",
      retryable: true,
    });
  }
}
