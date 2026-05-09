import {
  botCommandResponseSchema,
  botRuntimeCommandRequestSchema,
  closeTradeCommandRequestSchema,
  type BotCommandResponse,
  type BotRuntimeCommandRequest,
  type CloseTradeCommandRequest,
} from "@pacifica/contracts";
import { parseJsonResponse } from "../onboarding/backend-response";

const apiBaseUrl =
  import.meta.env.VITE_APP_API_BASE_URL?.trim() || "http://localhost:3003";

export async function pauseBotViaBackend(
  rawRequest: BotRuntimeCommandRequest,
  authToken?: string | null,
): Promise<BotCommandResponse> {
  const request = botRuntimeCommandRequestSchema.parse(rawRequest);
  return postCommand(`${apiBaseUrl}/api/runtime/pause`, request, authToken);
}

export async function resumeBotViaBackend(
  rawRequest: BotRuntimeCommandRequest,
  authToken?: string | null,
): Promise<BotCommandResponse> {
  const request = botRuntimeCommandRequestSchema.parse(rawRequest);
  return postCommand(`${apiBaseUrl}/api/runtime/resume`, request, authToken);
}

export async function closeTradeViaBackend(
  rawRequest: CloseTradeCommandRequest,
  authToken?: string | null,
): Promise<BotCommandResponse> {
  const request = closeTradeCommandRequestSchema.parse(rawRequest);
  return postCommand(
    `${apiBaseUrl}/api/trades/${request.tradeId}/close`,
    { walletAddress: request.walletAddress },
    authToken,
  );
}

async function postCommand(
  url: string,
  body: Record<string, unknown>,
  authToken?: string | null,
): Promise<BotCommandResponse> {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      body: JSON.stringify(body),
    });

    return botCommandResponseSchema.parse(await parseJsonResponse(response));
  } catch {
    return botCommandResponseSchema.parse({
      status: "error",
      code: "internal_error",
      message: "Command execution is temporarily unavailable.",
      retryable: true,
    });
  }
}
