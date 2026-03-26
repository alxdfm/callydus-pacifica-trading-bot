import {
  pacificaBuilderApprovalResponseSchema,
  pacificaBuilderApprovalSubmissionSchema,
  type PacificaBuilderApprovalResponse,
  type PacificaBuilderApprovalSubmission,
} from "@pacifica/contracts";

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
    const payload = await response.json();
    return pacificaBuilderApprovalResponseSchema.parse(payload);
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
