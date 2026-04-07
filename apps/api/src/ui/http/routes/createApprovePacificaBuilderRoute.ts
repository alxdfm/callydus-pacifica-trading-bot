import {
  pacificaBuilderApprovalResponseSchema,
  pacificaBuilderApprovalSubmissionSchema,
  type PacificaBuilderApprovalResponse,
} from "@pacifica/contracts";
import type {
  ApprovePacificaBuilderInput,
  ApprovePacificaBuilderOutput,
} from "../../../application/approve-pacifica-builder/ApprovePacificaBuilder";

type ApprovePacificaBuilderHttpRequest = {
  body: ApprovePacificaBuilderInput;
};

export type ApprovePacificaBuilderHandler = (
  input: ApprovePacificaBuilderInput,
) => Promise<ApprovePacificaBuilderOutput>;

export function createApprovePacificaBuilderRoute(
  handler: ApprovePacificaBuilderHandler,
) {
  return async function handleApprovePacificaBuilder(
    request: ApprovePacificaBuilderHttpRequest,
  ): Promise<PacificaBuilderApprovalResponse> {
    const body = pacificaBuilderApprovalSubmissionSchema.parse(request.body);
    const result = await handler(body);
    return pacificaBuilderApprovalResponseSchema.parse(
      mapResultToContract(body, result),
    );
  };
}

function mapResultToContract(
  request: ApprovePacificaBuilderInput,
  result: ApprovePacificaBuilderOutput,
): PacificaBuilderApprovalResponse {
  if (result.ok) {
    return {
      status: "approved",
      mainWalletPublicKey: request.mainWalletPublicKey,
      builderCode: request.builderCode,
      approvedAt: result.approvedAt,
      canProceed: true,
    };
  }

  return {
    status: result.errorCode === "provider_unavailable" || result.errorCode === "internal_error"
      ? "error"
      : "rejected",
    code: result.errorCode,
    message: mapErrorCodeToMessage(result.errorCode),
    retryable:
      result.errorCode === "provider_unavailable" ||
      result.errorCode === "rate_limited",
    canProceed: false,
  };
}

function mapErrorCodeToMessage(
  errorCode: ApprovePacificaBuilderOutput extends infer Output
    ? Output extends { ok: false; errorCode: infer Code }
      ? Code
      : never
    : never,
) {
  switch (errorCode) {
    case "wallet_not_connected":
      return "Connect the main wallet before approving the builder code.";
    case "wallet_signature_unavailable":
      return "This wallet does not support message signing for builder approval.";
    case "wallet_signature_rejected":
      return "The wallet signature was rejected or could not be verified by Pacifica.";
    case "builder_approval_rejected":
      return "Pacifica rejected the builder approval request.";
    case "rate_limited":
      return "Pacifica rate limit reached. Try again shortly.";
    case "provider_unavailable":
      return "Pacifica is temporarily unavailable. Try again.";
    default:
      return "Builder approval failed due to an internal error.";
  }
}
