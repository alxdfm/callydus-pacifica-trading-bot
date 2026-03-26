import {
  pacificaCredentialSubmissionSchema,
  pacificaCredentialValidationResponseSchema,
  type PacificaCredentialSubmission,
  type PacificaCredentialValidationResponse,
} from "@pacifica/contracts";

const apiBaseUrl =
  import.meta.env.VITE_APP_API_BASE_URL?.trim() || "http://localhost:3000";

export async function validateAgentWalletViaBackend(
  rawSubmission: PacificaCredentialSubmission,
): Promise<PacificaCredentialValidationResponse> {
  const submission = pacificaCredentialSubmissionSchema.parse(rawSubmission);

  try {
    const response = await fetch(
      `${apiBaseUrl}/api/onboarding/credentials/validate`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submission),
      },
    );
    const payload = await response.json();
    return pacificaCredentialValidationResponseSchema.parse(payload);
  } catch {
    return pacificaCredentialValidationResponseSchema.parse({
      status: "error",
      code: "provider_unavailable",
      message: "Backend validation is unavailable. Check the local API server and try again.",
      retryable: true,
      field: null,
      canProceed: false,
    });
  }
}
