import type { AuthRepository } from "../../domain/auth/AuthRepository";
import type { BearerTokenService } from "../../infrastructure/auth/BearerTokenService";
import { verifySolanaWalletSignature } from "../../infrastructure/auth/SolanaSignatureVerifier";
import { buildSignInMessage } from "../request-auth-nonce/RequestAuthNonce";

export type VerifyAuthSignatureDependencies = {
  authRepository: AuthRepository;
  tokenService: BearerTokenService;
  now?: () => Date;
};

export type VerifyAuthSignatureInput = {
  walletAddress: string;
  nonce: string;
  expiresAt: string; // ISO — sent back by the client to reconstruct the signed message
  signature: string; // base64
};

export type VerifyAuthSignatureOutput =
  | { status: "ok"; token: string; expiresAt: string }
  | { status: "error"; code: string; message: string };

export function createVerifyAuthSignature(
  deps: VerifyAuthSignatureDependencies,
) {
  const now = deps.now ?? (() => new Date());

  return async function verifyAuthSignature(
    input: VerifyAuthSignatureInput,
  ): Promise<VerifyAuthSignatureOutput> {
    const consumed = await deps.authRepository.consumeNonce({
      nonce: input.nonce,
      walletAddress: input.walletAddress,
    });

    if (!consumed.valid) {
      return {
        status: "error",
        code: "invalid_nonce",
        message: "Nonce is invalid, expired, or already used.",
      };
    }

    // We don't store the expiresAt in the nonce response, so we reconstruct the
    // canonical message by looking up the nonce expiry from the consumed record.
    // Since we already consumed it, we need to rebuild the message using the
    // original format. However, we don't have expiresAt here — the client must
    // send it back for us to reconstruct the message faithfully.
    //
    // Design note: the client receives { nonce, expiresAt, message } from the
    // nonce endpoint and signs the `message` string directly. The server
    // reconstructs the same message for verification. Since we already validated
    // and consumed the nonce atomically above, a signature mismatch here means
    // the client signed the wrong content — this is not a replay.
    //
    // The expiresAt is embedded in the signed message. Since we verified the
    // nonce was valid and unexpired before consuming it, any expiresAt from the
    // client that passes signature verification is legitimate (they signed it,
    // so it must be the original expiresAt we issued).
    const message = buildSignInMessage({
      walletAddress: input.walletAddress,
      nonce: input.nonce,
      expiresAt: input.expiresAt,
    });

    const signatureValid = verifySolanaWalletSignature({
      walletAddress: input.walletAddress,
      message,
      signature: input.signature,
    });

    if (!signatureValid) {
      return {
        status: "error",
        code: "invalid_signature",
        message: "Signature verification failed.",
      };
    }

    const currentTime = now();
    const token = deps.tokenService.issue(input.walletAddress, currentTime);
    const tokenExpiresAt = new Date(currentTime.getTime() + 60 * 60 * 1000);

    return {
      status: "ok",
      token,
      expiresAt: tokenExpiresAt.toISOString(),
    };
  };
}
