import type {
  VerifyAuthSignatureInput,
  VerifyAuthSignatureOutput,
} from "../../../application/verify-auth-signature/VerifyAuthSignature";

export type VerifyAuthSignatureHandler = (
  input: VerifyAuthSignatureInput,
) => Promise<VerifyAuthSignatureOutput>;

export function createVerifyAuthSignatureRoute(
  handler: VerifyAuthSignatureHandler,
) {
  return async function handleVerifyAuthSignature(request: {
    body: unknown;
  }): Promise<VerifyAuthSignatureOutput> {
    const body = request.body as Record<string, unknown>;

    if (
      typeof body?.walletAddress !== "string" ||
      typeof body?.nonce !== "string" ||
      typeof body?.expiresAt !== "string" ||
      typeof body?.signature !== "string"
    ) {
      return {
        status: "error",
        code: "invalid_request",
        message: "walletAddress, nonce, expiresAt, and signature are required.",
      };
    }

    return handler({
      walletAddress: body.walletAddress,
      nonce: body.nonce,
      expiresAt: body.expiresAt,
      signature: body.signature,
    });
  };
}
