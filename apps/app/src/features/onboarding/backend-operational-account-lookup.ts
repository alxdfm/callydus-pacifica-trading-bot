import {
  operationalAccountLookupRequestSchema,
  operationalAccountLookupResponseSchema,
  type OperationalAccountLookupRequest,
  type OperationalAccountLookupResponse,
} from "@pacifica/contracts";
import { parseSchemaOrFallback } from "./backend-response";

const apiBaseUrl =
  import.meta.env.VITE_APP_API_BASE_URL?.trim() || "http://localhost:3000";

export async function lookupOperationalAccountViaBackend(
  rawRequest: OperationalAccountLookupRequest,
): Promise<OperationalAccountLookupResponse> {
  const request = operationalAccountLookupRequestSchema.parse(rawRequest);

  try {
    const response = await fetch(`${apiBaseUrl}/api/onboarding/account/lookup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    return await parseSchemaOrFallback(
      response,
      operationalAccountLookupResponseSchema,
      operationalAccountLookupResponseSchema.parse({
        status: "error",
        walletAddress: request.walletAddress,
        accountExists: false,
        code: "internal_error",
        message: "Account lookup returned an unexpected response. Check the API contract and try again.",
        retryable: false,
        canAccessProduct: false,
      }),
    );
  } catch {
    return operationalAccountLookupResponseSchema.parse({
      status: "error",
      walletAddress: request.walletAddress,
      accountExists: false,
      code: "provider_unavailable",
      message: "Account lookup is unavailable. Check the local API server and try again.",
      retryable: true,
      canAccessProduct: false,
    });
  }
}
