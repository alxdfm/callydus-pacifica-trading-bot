import {
  pacificaOperationalVerificationResponseSchema,
  pacificaOperationalVerificationSubmissionSchema,
  type PacificaOperationalVerificationResponse,
} from "@pacifica/contracts";
import type {
  VerifyPacificaOperationalInput,
  VerifyPacificaOperationalOutput,
} from "../../../application/verify-pacifica-operational/VerifyPacificaOperational";

type VerifyPacificaOperationalHttpRequest = {
  body: VerifyPacificaOperationalInput;
};

export type VerifyPacificaOperationalHandler = (
  input: VerifyPacificaOperationalInput,
) => Promise<VerifyPacificaOperationalOutput>;

export function createVerifyPacificaOperationalRoute(
  handler: VerifyPacificaOperationalHandler,
) {
  return async function handleVerifyPacificaOperational(
    request: VerifyPacificaOperationalHttpRequest,
  ): Promise<PacificaOperationalVerificationResponse> {
    const { credentialId } = pacificaOperationalVerificationSubmissionSchema.parse(
      request.body,
    );
    const walletAddress =
      typeof (request.body as Record<string, unknown>).walletAddress === "string"
        ? ((request.body as Record<string, unknown>).walletAddress as string)
        : "";
    const result = await handler({ credentialId, walletAddress });
    return pacificaOperationalVerificationResponseSchema.parse(
      mapResultToContract(result),
    );
  };
}

function mapResultToContract(
  result: VerifyPacificaOperationalOutput,
): PacificaOperationalVerificationResponse {
  if (result.ok) {
    return {
      status: "verified",
      credentialId: result.credentialId,
      operationalVerificationStatus: "verified",
      verifiedAt: result.verifiedAt,
      probeSymbol: result.probeSymbol,
      probeClientOrderId: result.probeClientOrderId,
      canProceed: true,
    };
  }

  return {
    status: result.operationalVerificationStatus,
    code: result.errorCode,
    message: mapErrorCodeToMessage(result.errorCode),
    retryable:
      result.errorCode === "provider_unavailable" ||
      result.errorCode === "rate_limited",
    canProceed: false,
  };
}

function mapErrorCodeToMessage(
  errorCode: VerifyPacificaOperationalOutput extends infer Output
    ? Output extends { ok: false; errorCode: infer Code }
      ? Code
      : never
    : never,
) {
  switch (errorCode) {
    case "credential_not_found":
      return "The selected credential was not found.";
    case "credential_not_valid":
      return "Validate the Agent Wallet before running the operational check.";
    case "probe_market_config_invalid":
      return "The operational probe is misconfigured for the selected Pacifica market.";
    case "signature_rejected":
      return "Pacifica rejected the Agent Wallet signature during the operational check.";
    case "agent_wallet_unauthorized_for_account":
      return "This Agent Wallet is not authorized to operate for the connected account. Use the Agent Wallet created for this Pacifica account and try again.";
    case "account_blocked":
      return "The Agent Wallet signature reached Pacifica, but the account could not complete the operational check.";
    case "rate_limited":
      return "Pacifica rate limit reached. Try again shortly.";
    case "provider_unavailable":
      return "Pacifica is temporarily unavailable. Try again.";
    default:
      return "Operational verification failed due to an internal error.";
  }
}
