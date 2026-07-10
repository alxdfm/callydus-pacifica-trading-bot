import {
  backtestResponseSchema,
  closeTradeResponseSchema,
  eventsResponseSchema,
  marketsResponseSchema,
  sessionResponseSchema,
  strategyResponseSchema,
  tradesResponseSchema,
  type BacktestRequest,
  type BacktestResponse,
  type CloseTradeResponse,
  type EventsResponse,
  type MarketsResponse,
  type SessionResponse,
  type StrategyDraft,
  type StrategyResponse,
  type TradesResponse,
} from "@pacifica/shared/contracts";
import { redirectToProfileOnUnauthorized } from "../features/auth/unauthorized-redirect";

// ---------------------------------------------------------------------------
// Client v2 — cada resposta é parseada com o MESMO schema que a API usou para
// validar antes de enviar (@pacifica/shared/contracts). Falha de parse ou de
// rede vira o envelope de erro do próprio contrato, nunca uma exceção solta.
// ---------------------------------------------------------------------------

const apiBaseUrl =
  import.meta.env.VITE_APP_API_BASE_URL?.trim() || "http://localhost:3003";

type ResponseSchema<T> = {
  safeParse: (value: unknown) => { success: true; data: T } | { success: false };
};

function contractError<T>(
  schema: ResponseSchema<T>,
  code: string,
  message: string,
  retryable: boolean,
): T {
  // Todo response schema do contrato inclui o apiErrorSchema na união,
  // então este parse é garantido
  const parsed = schema.safeParse({ status: "error", code, message, retryable });
  if (!parsed.success) {
    throw new Error("v2 contract is missing the error envelope union.");
  }
  return parsed.data;
}

async function requestV2<T>(
  schema: ResponseSchema<T>,
  path: string,
  token: string | null,
  init?: RequestInit,
): Promise<T> {
  try {
    const response = await fetch(`${apiBaseUrl}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (response.status === 401) {
      redirectToProfileOnUnauthorized();
    }

    const payload = (await response.json().catch(() => null)) as unknown;
    const parsed = schema.safeParse(payload);

    if (parsed.success) {
      return parsed.data;
    }

    return contractError(
      schema,
      "contract_violation",
      "The API returned an unexpected response.",
      false,
    );
  } catch {
    return contractError(
      schema,
      "provider_unavailable",
      "The API is unreachable. Try again.",
      true,
    );
  }
}

export function getSession(token: string | null): Promise<SessionResponse> {
  return requestV2(sessionResponseSchema, "/api/v2/session", token);
}

export function getTrades(
  token: string | null,
  closedLimit?: number,
): Promise<TradesResponse> {
  const query = closedLimit !== undefined ? `?limit=${closedLimit}` : "";
  return requestV2(tradesResponseSchema, `/api/v2/trades${query}`, token);
}

export function getMarkets(token: string | null): Promise<MarketsResponse> {
  return requestV2(marketsResponseSchema, "/api/v2/markets", token);
}

export function getEvents(token: string | null): Promise<EventsResponse> {
  return requestV2(eventsResponseSchema, "/api/v2/events", token);
}

export function saveStrategy(
  token: string | null,
  draft: StrategyDraft,
): Promise<StrategyResponse> {
  return requestV2(strategyResponseSchema, "/api/v2/strategy", token, {
    method: "POST",
    body: JSON.stringify({ draft }),
  });
}

export function activateStrategy(token: string | null): Promise<StrategyResponse> {
  return requestV2(strategyResponseSchema, "/api/v2/strategy/activate", token, {
    method: "POST",
  });
}

export function pauseStrategy(token: string | null): Promise<StrategyResponse> {
  return requestV2(strategyResponseSchema, "/api/v2/strategy/pause", token, {
    method: "POST",
  });
}

export function runBacktest(
  token: string | null,
  request: BacktestRequest,
): Promise<BacktestResponse> {
  return requestV2(backtestResponseSchema, "/api/v2/strategy/backtest", token, {
    method: "POST",
    body: JSON.stringify(request),
  });
}

export function closeTrade(
  token: string | null,
  tradeId: string,
): Promise<CloseTradeResponse> {
  return requestV2(
    closeTradeResponseSchema,
    `/api/v2/trades/${tradeId}/close`,
    token,
    { method: "POST" },
  );
}
