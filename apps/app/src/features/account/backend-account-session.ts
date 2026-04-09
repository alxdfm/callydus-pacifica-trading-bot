import {
  operationalSessionSnapshotRequestSchema,
  operationalSessionSnapshotResponseSchema,
  type OperationalSessionSnapshotRequest,
  type OperationalSessionSnapshotResponse,
} from "@pacifica/contracts";
import { parseSchemaOrFallback } from "../onboarding/backend-response";

const apiBaseUrl =
  import.meta.env.VITE_APP_API_BASE_URL?.trim() || "http://localhost:3003";

export async function readAccountSessionViaBackend(
  rawRequest: OperationalSessionSnapshotRequest,
): Promise<OperationalSessionSnapshotResponse> {
  const request = operationalSessionSnapshotRequestSchema.parse(rawRequest);

  try {
    const response = await fetch(`${apiBaseUrl}/api/account/session`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    return await parseSchemaOrFallback(
      response,
      operationalSessionSnapshotResponseSchema,
      operationalSessionSnapshotResponseSchema.parse({
        status: "error",
        walletAddress: request.walletAddress,
        accountExists: false,
        code: "internal_error",
        message:
          "Operational session returned an unexpected response. Check the API contract and try again.",
        retryable: false,
        canAccessProduct: false,
      }),
    );
  } catch {
    return operationalSessionSnapshotResponseSchema.parse({
      status: "error",
      walletAddress: request.walletAddress,
      accountExists: false,
      code: "provider_unavailable",
      message:
        "Operational session is unavailable. Check the local API server and try again.",
      retryable: true,
      canAccessProduct: false,
    });
  }
}
