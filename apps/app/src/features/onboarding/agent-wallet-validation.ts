import bs58 from "bs58";
import { Keypair, PublicKey } from "@solana/web3.js";
import {
  pacificaCredentialSubmissionSchema,
  pacificaCredentialValidationResponseSchema,
  type PacificaCredentialSubmission,
  type PacificaCredentialValidationResponse,
} from "@pacifica/contracts";

function isValidPublicKey(value: string) {
  try {
    new PublicKey(value);
    return true;
  } catch {
    return false;
  }
}

function isValidBase58SecretKey(value: string) {
  try {
    const bytes = bs58.decode(value.trim());

    if (bytes.length === 0) {
      return false;
    }

    Keypair.fromSecretKey(bytes);
    return true;
  } catch {
    return false;
  }
}

function buildSuccessResponse(
  submission: PacificaCredentialSubmission,
): PacificaCredentialValidationResponse {
  return pacificaCredentialValidationResponseSchema.parse({
    status: "valid",
    credentialId: crypto.randomUUID(),
    mainWalletPublicKey: submission.mainWalletPublicKey,
    agentWalletPublicKey: submission.agentWalletPublicKey,
    keyFingerprint: submission.agentWalletPublicKey.slice(0, 8),
    validationStatus: "valid",
    validatedAt: new Date().toISOString(),
    canProceed: true,
  });
}

function buildErrorResponse(
  response: Extract<PacificaCredentialValidationResponse, { canProceed: false }>,
) {
  return pacificaCredentialValidationResponseSchema.parse(response);
}

export async function validateAgentWalletLocally(
  rawSubmission: PacificaCredentialSubmission,
): Promise<PacificaCredentialValidationResponse> {
  const submission = pacificaCredentialSubmissionSchema.parse(rawSubmission);

  await new Promise((resolve) => window.setTimeout(resolve, 700));

  if (!submission.mainWalletPublicKey.trim()) {
    return buildErrorResponse({
      status: "error",
      code: "wallet_not_connected",
      message: "Connect your main wallet before validating the Agent Wallet.",
      retryable: false,
      field: "mainWalletPublicKey",
      canProceed: false,
    });
  }

  if (!isValidPublicKey(submission.agentWalletPublicKey)) {
    return buildErrorResponse({
      status: "invalid",
      code: "invalid_agent_wallet_format",
      message: "Enter a valid Solana public key for the Agent Wallet.",
      retryable: false,
      field: "agentWalletPublicKey",
      canProceed: false,
    });
  }

  if (!isValidBase58SecretKey(submission.agentWalletPrivateKey)) {
    return buildErrorResponse({
      status: "invalid",
      code: "invalid_agent_wallet_secret",
      message:
        "Enter the Agent Wallet private key as a valid base58 secret key generated for that wallet.",
      retryable: false,
      field: "agentWalletPrivateKey",
      canProceed: false,
    });
  }

  return buildSuccessResponse(submission);
}
