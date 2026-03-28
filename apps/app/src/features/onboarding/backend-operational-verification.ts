import {
  pacificaOperationalVerificationResponseSchema,
  pacificaOperationalVerificationSubmissionSchema,
  type PacificaOperationalVerificationResponse,
  type PacificaOperationalVerificationSubmission,
} from "@pacifica/contracts";
import { parseSchemaOrFallback } from "./backend-response";

const apiBaseUrl =
  import.meta.env.VITE_APP_API_BASE_URL?.trim() || "http://localhost:3000";

export async function verifyAgentWalletOperationallyViaBackend(
  rawSubmission: PacificaOperationalVerificationSubmission,
): Promise<PacificaOperationalVerificationResponse> {
  const submission =
    pacificaOperationalVerificationSubmissionSchema.parse(rawSubmission);

  try {
    const response = await fetch(
      `${apiBaseUrl}/api/onboarding/credentials/verify-operational`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submission),
      },
    );

    return await parseSchemaOrFallback(
      response,
      pacificaOperationalVerificationResponseSchema,
      pacificaOperationalVerificationResponseSchema.parse({
        status: "error",
        code: "internal_error",
        message:
          "The operational check returned an unexpected response. Check the API contract and try again.",
        retryable: false,
        canProceed: false,
      }),
    );
  } catch {
    return pacificaOperationalVerificationResponseSchema.parse({
      status: "error",
      code: "provider_unavailable",
      message:
        "The operational check is temporarily unavailable. Check the local API server and try again.",
      retryable: true,
      canProceed: false,
    });
  }
}
