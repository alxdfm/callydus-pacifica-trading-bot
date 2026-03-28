import {
  pacificaBuilderApprovalResponseSchema,
  pacificaBuilderApprovalSubmissionSchema,
  type PacificaBuilderApprovalResponse,
  type PacificaBuilderApprovalSubmission,
} from "@pacifica/contracts";
import { parseSchemaOrFallback } from "./backend-response";

const apiBaseUrl =
  import.meta.env.VITE_APP_API_BASE_URL?.trim() || "http://localhost:3000";

export async function approveBuilderCodeViaBackend(
  rawSubmission: PacificaBuilderApprovalSubmission,
): Promise<PacificaBuilderApprovalResponse> {
  const submission = pacificaBuilderApprovalSubmissionSchema.parse(rawSubmission);

  try {
    const response = await fetch(`${apiBaseUrl}/api/onboarding/builder/approve`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(submission),
    });

    return await parseSchemaOrFallback(
      response,
      pacificaBuilderApprovalResponseSchema,
      pacificaBuilderApprovalResponseSchema.parse({
        status: "error",
        code: "internal_error",
        message:
          "Builder approval returned an unexpected response. Check the API contract and try again.",
        retryable: false,
        canProceed: false,
      }),
    );
  } catch {
    return pacificaBuilderApprovalResponseSchema.parse({
      status: "error",
      code: "provider_unavailable",
      message: "Builder approval is temporarily unavailable. Check the local API server and try again.",
      retryable: true,
      canProceed: false,
    });
  }
}
