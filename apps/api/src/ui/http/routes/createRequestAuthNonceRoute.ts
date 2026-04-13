import type { RequestAuthNonceOutput } from "../../../application/request-auth-nonce/RequestAuthNonce";

export type RequestAuthNonceHandler = (input: {
  walletAddress: string;
}) => Promise<RequestAuthNonceOutput>;

export function createRequestAuthNonceRoute(handler: RequestAuthNonceHandler) {
  return async function handleRequestAuthNonce(input: {
    walletAddress: string;
  }): Promise<RequestAuthNonceOutput> {
    if (!input.walletAddress) {
      return {
        status: "error",
        code: "missing_wallet",
        message: "wallet query parameter is required.",
      };
    }
    return handler({ walletAddress: input.walletAddress });
  };
}
