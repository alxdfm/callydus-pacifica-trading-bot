import type {
  ValidatePacificaCredentialsInput,
  ValidatePacificaCredentialsOutput,
} from "../../../application/validate-pacifica-credentials/ValidatePacificaCredentials";
import {
  pacificaCredentialSubmissionSchema,
  pacificaCredentialValidationResponseSchema,
  type PacificaCredentialValidationResponse,
} from "@pacifica/contracts";

export type ValidatePacificaCredentialsHttpRequest = {
  body: ValidatePacificaCredentialsInput;
};

export type ValidatePacificaCredentialsHandler = (
  input: ValidatePacificaCredentialsInput,
) => Promise<ValidatePacificaCredentialsOutput>;

export function createValidatePacificaCredentialsRoute(
  handler: ValidatePacificaCredentialsHandler,
) {
  return async function handleValidatePacificaCredentials(
    request: ValidatePacificaCredentialsHttpRequest,
  ): Promise<PacificaCredentialValidationResponse> {
    const body = pacificaCredentialSubmissionSchema.parse(request.body);
    const result = await handler(body);
    return pacificaCredentialValidationResponseSchema.parse(
      mapResultToContract(body, result),
    );
  };
}

function mapResultToContract(
  request: ValidatePacificaCredentialsInput,
  result: ValidatePacificaCredentialsOutput,
): PacificaCredentialValidationResponse {
  if (result.ok) {
    return {
      status: "valid",
      credentialId: result.credentialId,
      mainWalletPublicKey: request.mainWalletPublicKey,
      agentWalletPublicKey: request.agentWalletPublicKey,
      keyFingerprint: result.keyFingerprint,
      validationStatus: "valid",
      validatedAt: result.validatedAt,
      canProceed: true,
    };
  }

  return {
    status: result.validationStatus,
    code: result.errorCode,
    message: mapErrorCodeToMessage(result.errorCode),
    retryable:
      result.errorCode === "provider_unavailable" ||
      result.errorCode === "rate_limited",
    field: mapErrorCodeToField(result.errorCode),
    canProceed: false,
  };
}

function mapErrorCodeToField(
  errorCode: ValidatePacificaCredentialsOutput extends infer Output
    ? Output extends { ok: false; errorCode: infer Code }
      ? Code
      : never
    : never,
) {
  switch (errorCode) {
    case "wallet_not_connected":
      return "mainWalletPublicKey" as const;
    case "invalid_agent_wallet_format":
    case "agent_wallet_mismatch":
      return "agentWalletPublicKey" as const;
    case "invalid_agent_wallet_secret":
      return "agentWalletPrivateKey" as const;
    default:
      return null;
  }
}

function mapErrorCodeToMessage(
  errorCode: ValidatePacificaCredentialsOutput extends infer Output
    ? Output extends { ok: false; errorCode: infer Code }
      ? Code
      : never
    : never,
) {
  switch (errorCode) {
    case "wallet_not_connected":
      return "Connect the main wallet before validating the Agent Wallet.";
    case "invalid_agent_wallet_format":
      return "Enter a valid Solana public key for the Agent Wallet.";
    case "invalid_agent_wallet_secret":
      return "Enter the Agent Wallet private key as a valid base58 secret key generated for that wallet.";
    case "agent_wallet_mismatch":
      return "The submitted Agent Wallet private key does not match the informed Agent Wallet public key.";
    case "builder_approval_rejected":
      return "Unable to validate the Agent Wallet with Pacifica. Review the credentials and try again.";
    case "builder_fee_limit_too_low":
      return "Unable to validate the Agent Wallet with Pacifica. Contact support if the issue persists.";
    case "validation_rejected":
      return "Unable to validate the Agent Wallet with Pacifica. Review the credentials and try again.";
    case "provider_unavailable":
      return "Pacifica is temporarily unavailable. Try again.";
    case "rate_limited":
      return "Pacifica rate limit reached. Try again shortly.";
    default:
      return "Backend credential validation is misconfigured or failed unexpectedly. Check the API configuration and credential encryption setup.";
  }
}
