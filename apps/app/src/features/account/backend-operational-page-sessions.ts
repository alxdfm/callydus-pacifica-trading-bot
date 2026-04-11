import {
  operationalDashboardSessionResponseSchema,
  operationalHistorySessionResponseSchema,
  operationalPresetsSessionResponseSchema,
  operationalProfileSessionResponseSchema,
  operationalSessionSnapshotRequestSchema,
  operationalTradesSessionResponseSchema,
  type OperationalDashboardSessionResponse,
  type OperationalHistorySessionResponse,
  type OperationalPresetsSessionResponse,
  type OperationalProfileSessionResponse,
  type OperationalSessionSnapshotRequest,
  type OperationalTradesSessionResponse,
} from "@pacifica/contracts";
import { parseSchemaOrFallback } from "../onboarding/backend-response";

const apiBaseUrl =
  import.meta.env.VITE_APP_API_BASE_URL?.trim() || "http://localhost:3003";

async function readOperationalPageSessionViaBackend<TResponse>(
  rawRequest: OperationalSessionSnapshotRequest,
  path: string,
  schema: {
    parse: (value: unknown) => TResponse;
    safeParse: (value: unknown) => { success: true; data: TResponse } | { success: false };
  },
): Promise<TResponse> {
  const request = operationalSessionSnapshotRequestSchema.parse(rawRequest);

  try {
    const response = await fetch(`${apiBaseUrl}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    return await parseSchemaOrFallback(
      response,
      schema,
      schema.parse({
        status: "error",
        walletAddress: request.walletAddress,
        accountExists: false,
        code: "internal_error",
        message:
          "Operational data returned an unexpected response. Check the API contract and try again.",
        retryable: false,
        canAccessProduct: false,
      }),
    );
  } catch {
    return schema.parse({
      status: "error",
      walletAddress: request.walletAddress,
      accountExists: false,
      code: "provider_unavailable",
      message:
        "Operational data is unavailable. Check the local API server and try again.",
      retryable: true,
      canAccessProduct: false,
    });
  }
}

export function readOperationalProfileViaBackend(
  request: OperationalSessionSnapshotRequest,
): Promise<OperationalProfileSessionResponse> {
  return readOperationalPageSessionViaBackend(
    request,
    "/api/account/profile",
    operationalProfileSessionResponseSchema,
  );
}

export function readOperationalDashboardViaBackend(
  request: OperationalSessionSnapshotRequest,
): Promise<OperationalDashboardSessionResponse> {
  return readOperationalPageSessionViaBackend(
    request,
    "/api/account/dashboard",
    operationalDashboardSessionResponseSchema,
  );
}

export function readOperationalPresetsViaBackend(
  request: OperationalSessionSnapshotRequest,
): Promise<OperationalPresetsSessionResponse> {
  return readOperationalPageSessionViaBackend(
    request,
    "/api/account/presets",
    operationalPresetsSessionResponseSchema,
  );
}

export function readOperationalTradesViaBackend(
  request: OperationalSessionSnapshotRequest,
): Promise<OperationalTradesSessionResponse> {
  return readOperationalPageSessionViaBackend(
    request,
    "/api/account/trades",
    operationalTradesSessionResponseSchema,
  );
}

export function readOperationalHistoryViaBackend(
  request: OperationalSessionSnapshotRequest,
): Promise<OperationalHistorySessionResponse> {
  return readOperationalPageSessionViaBackend(
    request,
    "/api/account/history",
    operationalHistorySessionResponseSchema,
  );
}
