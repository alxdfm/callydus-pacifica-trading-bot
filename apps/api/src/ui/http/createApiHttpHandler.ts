import { timingSafeEqual } from "node:crypto";
import { extractAuthContext } from "../../infrastructure/auth/extractAuthContext";
import type { createApiModule } from "../../createApiModule";

export type ApiHttpRequest = {
  method: string;
  path: string;
  headers: Record<string, string | string[] | undefined>;
  queryStringParameters: Record<string, string | undefined>;
  rawBody: string | null;
};

export type ApiHttpResponse = {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
};

type CreateApiHttpHandlerOptions = {
  internalApiSecret: string;
};

function getHeader(
  headers: Record<string, string | string[] | undefined>,
  name: string,
): string | undefined {
  const value = headers[name.toLowerCase()];
  if (Array.isArray(value)) return value[0];
  return value;
}

function parseBody(rawBody: string | null): unknown {
  if (!rawBody) return {};
  try {
    return JSON.parse(rawBody) as unknown;
  } catch {
    return {};
  }
}

function json(statusCode: number, body: unknown): ApiHttpResponse {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

function sanitizeForLog(value: string): string {
  return value.replace(/[1-9A-HJ-NP-Za-km-z]{64,}/g, "[REDACTED]");
}

function isZodError(
  err: unknown,
): err is { issues: Array<{ code: string; message: string; path: (string | number)[] }> } {
  return (
    err instanceof Error &&
    err.name === "ZodError" &&
    Array.isArray((err as unknown as Record<string, unknown>).issues)
  );
}

const UNAUTHORIZED = json(401, {
  status: "error",
  code: "unauthorized",
  message: "Authentication required.",
});

export function createApiHttpHandler(
  api: ReturnType<typeof createApiModule>,
  options: CreateApiHttpHandlerOptions,
) {
  const { internalApiSecret } = options;

  function requireAuth(
    headers: Record<string, string | string[] | undefined>,
  ): string | null {
    const authHeader = getHeader(headers, "authorization");
    const authContext = extractAuthContext(authHeader, api.tokenService);
    return authContext?.walletAddress ?? null;
  }

  return async function handleApiRequest(
    request: ApiHttpRequest,
  ): Promise<ApiHttpResponse> {
    const { method, path, headers, queryStringParameters, rawBody } = request;

    try {
      // Handle CORS preflight
      if (method === "OPTIONS") {
        return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: "" };
      }

      // --- Auth endpoints (public) ---

      if (method === "GET" && path.startsWith("/api/auth/nonce")) {
        const walletAddress = queryStringParameters["wallet"] ?? "";
        const result = await api.router.requestAuthNonce({ walletAddress });
        return json(result.status === "ok" ? 200 : 400, result);
      }

      if (method === "POST" && path === "/api/auth/verify") {
        const body = parseBody(rawBody);
        const result = await api.router.verifyAuthSignature({ body });
        return json(result.status === "ok" ? 200 : 401, result);
      }

      // --- Onboarding endpoints (public) ---

      if (method === "POST" && path === "/api/onboarding/builder/approve") {
        const body = parseBody(rawBody);
        const result = await api.router.approvePacificaBuilder({
          body: body as never,
        });
        return json(result.canProceed ? 200 : 400, result);
      }

      if (method === "POST" && path === "/api/onboarding/account/lookup") {
        const body = parseBody(rawBody);
        const result = await api.router.lookupOperationalAccountByWallet({
          body: body as never,
        });
        return json(result.status === "error" ? 500 : 200, result);
      }

      if (method === "POST" && path === "/api/onboarding/credentials/validate") {
        const body = parseBody(rawBody);
        const result = await api.router.validatePacificaCredentials({
          body: body as never,
        });
        return json(result.canProceed ? 200 : 400, result);
      }

      if (
        method === "POST" &&
        path === "/api/onboarding/credentials/verify-operational"
      ) {
        const walletAddress = requireAuth(headers);
        if (!walletAddress) return UNAUTHORIZED;
        const body = parseBody(rawBody);
        const result = await api.router.verifyPacificaOperational({
          body: { ...(body as Record<string, unknown>), walletAddress } as never,
        });
        return json(result.canProceed ? 200 : 400, result);
      }

      // --- Strategy endpoints ---

      if (method === "POST" && path === "/api/strategies/your/activate") {
        const walletAddress = requireAuth(headers);
        if (!walletAddress) return UNAUTHORIZED;
        const body = parseBody(rawBody);
        const result = await api.router.activateYourStrategy({
          body: { ...(body as Record<string, unknown>), walletAddress } as never,
        });
        return json(result.status === "success" ? 200 : 400, result);
      }

      if (method === "POST" && path === "/api/strategies/your/save") {
        const walletAddress = requireAuth(headers);
        if (!walletAddress) return UNAUTHORIZED;
        const body = parseBody(rawBody);
        const result = await api.router.saveYourStrategy({
          body: { ...(body as Record<string, unknown>), walletAddress } as never,
        });
        return json(result.status === "success" ? 200 : 400, result);
      }

      if (method === "POST" && path === "/api/strategies/your/backtest-preview") {
        const body = parseBody(rawBody);
        const result = await api.router.previewYourStrategyBacktest({
          body: body as never,
        });
        return json(result.status === "success" ? 200 : 400, result);
      }

      // --- Runtime command endpoints (authenticated) ---

      if (method === "POST" && path === "/api/runtime/pause") {
        const walletAddress = requireAuth(headers);
        if (!walletAddress) return UNAUTHORIZED;
        const body = parseBody(rawBody);
        const result = await api.router.pauseBot({
          body: { ...(body as Record<string, unknown>), walletAddress } as never,
        });
        return json(result.status === "success" ? 200 : 400, result);
      }

      if (method === "POST" && path === "/api/runtime/resume") {
        const walletAddress = requireAuth(headers);
        if (!walletAddress) return UNAUTHORIZED;
        const body = parseBody(rawBody);
        const result = await api.router.resumeBot({
          body: { ...(body as Record<string, unknown>), walletAddress } as never,
        });
        return json(result.status === "success" ? 200 : 400, result);
      }

      if (method === "POST" && path === "/api/runtime/heartbeat") {
        const body = parseBody(rawBody);
        const result = await api.router.heartbeatRuntime({
          body: body as never,
        });
        return json(result.status === "success" ? 200 : 400, result);
      }

      if (method === "POST" && path === "/api/runtime/reconcile") {
        const body = parseBody(rawBody);
        const result = await api.router.reconcileRuntime({
          body: body as never,
        });
        return json(result.status === "success" ? 200 : 400, result);
      }

      const closeTradeMatch = /^\/api\/trades\/([^/]+)\/close$/.exec(path);
      if (method === "POST" && closeTradeMatch) {
        const walletAddress = requireAuth(headers);
        if (!walletAddress) return UNAUTHORIZED;
        const tradeId = closeTradeMatch[1] ?? "";
        const result = await api.router.closeTrade({
          body: { walletAddress, tradeId } as never,
        });
        return json(result.status === "success" ? 200 : 400, result);
      }

      // --- Market data endpoints ---

      if (method === "GET" && path === "/api/market/prices") {
        const result = await api.router.getMarketPrices();
        return json(result.status === "success" ? 200 : 400, result);
      }

      if (method === "POST" && path === "/api/market/candles") {
        const body = parseBody(rawBody);
        const result = await api.router.getMarketCandles({
          body: body as never,
        });
        return json(result.status === "success" ? 200 : 400, result);
      }

      if (method === "POST" && path === "/api/internal/market/refresh") {
        const providedSecret = getHeader(headers, "x-internal-secret") ?? "";
        const secretBuffer = Buffer.from(internalApiSecret);
        const providedBuffer = Buffer.from(providedSecret);
        const authorized =
          providedBuffer.length === secretBuffer.length &&
          timingSafeEqual(providedBuffer, secretBuffer);

        if (!authorized) {
          return json(403, { message: "Forbidden" });
        }

        const body = parseBody(rawBody);
        const result = await api.router.refreshMarketData({
          body: body as never,
        });
        return json(200, result);
      }

      // --- Account read endpoints (authenticated) ---

      if (method === "POST" && path === "/api/account/session") {
        const walletAddress = requireAuth(headers);
        if (!walletAddress) return UNAUTHORIZED;
        const result = await api.router.getOperationalSessionByWallet({
          body: { walletAddress } as never,
        });
        return json(result.status === "error" ? 500 : 200, result);
      }

      if (method === "POST" && path === "/api/account/profile") {
        const walletAddress = requireAuth(headers);
        if (!walletAddress) return UNAUTHORIZED;
        const result = await api.router.getOperationalProfileByWallet({
          body: { walletAddress } as never,
        });
        return json(result.status === "error" ? 500 : 200, result);
      }

      if (method === "POST" && path === "/api/account/dashboard") {
        const walletAddress = requireAuth(headers);
        if (!walletAddress) return UNAUTHORIZED;
        const result = await api.router.getOperationalDashboardByWallet({
          body: { walletAddress } as never,
        });
        return json(result.status === "error" ? 500 : 200, result);
      }

      if (method === "POST" && path === "/api/account/presets") {
        const walletAddress = requireAuth(headers);
        if (!walletAddress) return UNAUTHORIZED;
        const result = await api.router.getOperationalPresetsByWallet({
          body: { walletAddress } as never,
        });
        return json(result.status === "error" ? 500 : 200, result);
      }

      if (method === "POST" && path === "/api/account/trades") {
        const walletAddress = requireAuth(headers);
        if (!walletAddress) return UNAUTHORIZED;
        const result = await api.router.getOperationalTradesByWallet({
          body: { walletAddress } as never,
        });
        return json(result.status === "error" ? 500 : 200, result);
      }

      if (method === "POST" && path === "/api/account/history") {
        const walletAddress = requireAuth(headers);
        if (!walletAddress) return UNAUTHORIZED;
        const result = await api.router.getOperationalHistoryByWallet({
          body: { walletAddress } as never,
        });
        return json(result.status === "error" ? 500 : 200, result);
      }

      return json(404, { message: "Not found" });
    } catch (err) {
      if (isZodError(err)) {
        return json(400, {
          status: "error",
          code: "validation_error",
          issues: err.issues,
        });
      }

      const message = err instanceof Error ? err.message : String(err);
      const stack = err instanceof Error ? err.stack : undefined;
      console.error(
        JSON.stringify({
          event: "api.request_error",
          method,
          path,
          error: sanitizeForLog(message),
          stack: stack ? sanitizeForLog(stack) : undefined,
        }),
      );
      return json(500, { status: "error", code: "internal_error" });
    }
  };
}
