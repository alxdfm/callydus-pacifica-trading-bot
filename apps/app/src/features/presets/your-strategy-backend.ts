import {
  activateYourStrategyResponseSchema,
  getYourStrategyResponseSchema,
  saveYourStrategyResponseSchema,
  type ActivateYourStrategyRequest,
  type ActivateYourStrategyResponse,
  type GetYourStrategyResponse,
  type SaveYourStrategyRequest,
  type SaveYourStrategyResponse,
  type YourStrategyBacktestPreviewRequest,
  type YourStrategyBacktestPreviewResponse,
  yourStrategyBacktestPreviewResponseSchema,
} from "@pacifica/contracts";
import { parseJsonResponse } from "../onboarding/backend-response";

const defaultApiBaseUrl = "http://localhost:3003";

export async function getYourStrategyViaBackend(
  walletAddress: string,
): Promise<GetYourStrategyResponse> {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_APP_API_BASE_URL ?? defaultApiBaseUrl}/api/strategies/your/get`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ walletAddress }),
      },
    );

    return getYourStrategyResponseSchema.parse(await parseJsonResponse(response));
  } catch {
    return getYourStrategyResponseSchema.parse({
      status: "error",
      code: "internal_error",
      message: "Could not load YOUR Strategy right now.",
      retryable: true,
    });
  }
}

export async function saveYourStrategyViaBackend(
  request: SaveYourStrategyRequest,
): Promise<SaveYourStrategyResponse> {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_APP_API_BASE_URL ?? defaultApiBaseUrl}/api/strategies/your/save`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      },
    );

    return saveYourStrategyResponseSchema.parse(await parseJsonResponse(response));
  } catch {
    return saveYourStrategyResponseSchema.parse({
      status: "error",
      code: "internal_error",
      message: "Could not save YOUR Strategy right now.",
      retryable: true,
    });
  }
}

export async function previewYourStrategyBacktestViaBackend(
  request: YourStrategyBacktestPreviewRequest,
): Promise<YourStrategyBacktestPreviewResponse> {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_APP_API_BASE_URL ?? defaultApiBaseUrl}/api/strategies/your/backtest-preview`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      },
    );

    return yourStrategyBacktestPreviewResponseSchema.parse(
      await parseJsonResponse(response),
    );
  } catch {
    return yourStrategyBacktestPreviewResponseSchema.parse({
      status: "error",
      code: "internal_error",
      message: "YOUR Strategy backtest preview is temporarily unavailable.",
      retryable: true,
    });
  }
}

export async function activateYourStrategyViaBackend(
  request: ActivateYourStrategyRequest,
): Promise<ActivateYourStrategyResponse> {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_APP_API_BASE_URL ?? defaultApiBaseUrl}/api/strategies/your/activate`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      },
    );

    return activateYourStrategyResponseSchema.parse(
      await parseJsonResponse(response),
    );
  } catch {
    return activateYourStrategyResponseSchema.parse({
      status: "error",
      code: "internal_error",
      message: "YOUR Strategy could not be activated right now.",
      retryable: true,
    });
  }
}
