import { randomUUID } from "node:crypto";
import type { AuthRepository } from "../../domain/auth/AuthRepository";

export type RequestAuthNonceDependencies = {
  authRepository: AuthRepository;
  now?: () => Date;
};

export type RequestAuthNonceInput = {
  walletAddress: string;
};

export type RequestAuthNonceOutput =
  | { status: "ok"; nonce: string; expiresAt: string; message: string }
  | { status: "error"; code: string; message: string };

const NONCE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// Solana base58 public keys are 32–44 characters long.
const WALLET_ADDRESS_REGEX = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

export function createRequestAuthNonce(deps: RequestAuthNonceDependencies) {
  const now = deps.now ?? (() => new Date());

  return async function requestAuthNonce(
    input: RequestAuthNonceInput,
  ): Promise<RequestAuthNonceOutput> {
    if (!WALLET_ADDRESS_REGEX.test(input.walletAddress)) {
      return {
        status: "error",
        code: "invalid_wallet_address",
        message: "Invalid wallet address format.",
      };
    }

    const nonce = randomUUID();
    const currentTime = now();
    const expiresAt = new Date(currentTime.getTime() + NONCE_TTL_MS);

    const message = buildSignInMessage({
      walletAddress: input.walletAddress,
      nonce,
      expiresAt: expiresAt.toISOString(),
    });

    await deps.authRepository.createNonce({
      walletAddress: input.walletAddress,
      nonce,
      expiresAt,
    });

    return {
      status: "ok",
      nonce,
      expiresAt: expiresAt.toISOString(),
      message,
    };
  };
}

export function buildSignInMessage(input: {
  walletAddress: string;
  nonce: string;
  expiresAt: string;
}): string {
  return [
    "Sign in to Pacifica Bot",
    `Wallet: ${input.walletAddress}`,
    `Nonce: ${input.nonce}`,
    `Expires: ${input.expiresAt}`,
  ].join("\n");
}
