import {
  presetActivationResponseSchema,
  type PresetActivationRequest,
  type PresetActivationSuccess,
} from "@pacifica/contracts";
import { parseJsonResponse } from "../onboarding/backend-response";

const defaultApiBaseUrl = "http://localhost:3000";

export async function activatePreset(
  request: PresetActivationRequest,
): Promise<PresetActivationSuccess> {
  const response = await fetch(
    `${import.meta.env.VITE_APP_API_BASE_URL ?? defaultApiBaseUrl}/api/presets/activate`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    },
  );

  const payload = presetActivationResponseSchema.parse(
    await parseJsonResponse(response),
  );

  if (payload.status === "success") {
    return payload;
  }

  throw new Error(payload.message);
}
