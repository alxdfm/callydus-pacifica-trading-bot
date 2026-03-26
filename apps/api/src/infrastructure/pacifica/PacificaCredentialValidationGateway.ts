import type {
  PacificaCredentialValidationPort,
  PacificaCredentialValidationResult,
} from "../../domain/pacifica-credentials/PacificaCredentialValidationPort";
import type { ApiEnvironment } from "../config/createApiEnvironment";
import { deriveSignerPublicKeyFromPrivateKey } from "./PacificaClient";

export class PacificaCredentialValidationGateway
  implements PacificaCredentialValidationPort
{
  constructor(private readonly environment: ApiEnvironment) {}

  async validateAgentWallet(input: {
    mainWalletPublicKey: string;
    agentWalletPublicKey: string;
    agentWalletPrivateKey: string;
  }): Promise<PacificaCredentialValidationResult> {
    try {
      const derivedPublicKey = deriveSignerPublicKeyFromPrivateKey(
        input.agentWalletPrivateKey,
      );

      if (derivedPublicKey !== input.agentWalletPublicKey.trim()) {
        return { ok: false, errorCode: "agent_wallet_mismatch" };
      }

      return {
        ok: true,
        validatedAt: new Date().toISOString(),
      };
    } catch (error) {
      logCredentialValidationError(
        "Pacifica credential validation failed.",
        {
          mainWalletPublicKey: input.mainWalletPublicKey,
          agentWalletPublicKey: input.agentWalletPublicKey,
        },
        error,
      );
      return mapValidationError(error);
    }
  }
}

function logCredentialValidationError(
  message: string,
  context: {
    mainWalletPublicKey: string;
    agentWalletPublicKey: string;
  },
  error?: unknown,
) {
  console.error("[pacifica-credential-validation]", {
    message,
    mainWalletPublicKey: shortenPublicKey(context.mainWalletPublicKey),
    agentWalletPublicKey: shortenPublicKey(context.agentWalletPublicKey),
    error: serializeError(error),
  });
}

function shortenPublicKey(value: string) {
  const normalized = value.trim();

  if (normalized.length <= 10) {
    return normalized;
  }

  return `${normalized.slice(0, 4)}...${normalized.slice(-4)}`;
}

function serializeError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return error ?? null;
}

function mapValidationError(
  error: unknown,
): Extract<PacificaCredentialValidationResult, { ok: false }> {
  if (error instanceof Error) {
    if (error.message.toLowerCase().includes("mismatch")) {
      return { ok: false, errorCode: "agent_wallet_mismatch" };
    }

    if (error.message.toLowerCase().includes("base58")) {
      return { ok: false, errorCode: "invalid_agent_wallet_format" };
    }

    if (error.message.toLowerCase().includes("private key")) {
      return { ok: false, errorCode: "invalid_agent_wallet_secret" };
    }
  }

  return { ok: false, errorCode: "internal_error" };
}
