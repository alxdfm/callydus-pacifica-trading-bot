import {
  operationalAccountLookupRequestSchema,
  operationalAccountLookupResponseSchema,
  type OperationalAccountLookupResponse,
} from "@pacifica/contracts";
import type {
  LookupOperationalAccountByWalletInput,
  LookupOperationalAccountByWalletOutput,
} from "../../../application/lookup-operational-account-by-wallet/LookupOperationalAccountByWallet";

type LookupOperationalAccountByWalletHttpRequest = {
  body: LookupOperationalAccountByWalletInput;
};

export type LookupOperationalAccountByWalletHandler = (
  input: LookupOperationalAccountByWalletInput,
) => Promise<LookupOperationalAccountByWalletOutput>;

export function createLookupOperationalAccountByWalletRoute(
  handler: LookupOperationalAccountByWalletHandler,
) {
  return async function handleLookupOperationalAccountByWallet(
    request: LookupOperationalAccountByWalletHttpRequest,
  ): Promise<OperationalAccountLookupResponse> {
    const body = operationalAccountLookupRequestSchema.parse(request.body);
    const result = await handler(body);

    if (!result.accountExists) {
      return operationalAccountLookupResponseSchema.parse({
        status: "not_found",
        walletAddress: result.walletAddress,
        accountExists: false,
        canAccessProduct: false,
      });
    }

    return operationalAccountLookupResponseSchema.parse({
      status: "found",
      walletAddress: result.walletAddress,
      accountExists: true,
      onboardingStatus: result.onboardingStatus,
      credentialId: result.credentialId,
      agentWalletPublicKey: result.agentWalletPublicKey,
      credentialAlias: result.credentialAlias,
      keyFingerprint: result.keyFingerprint,
      operationallyVerified: result.operationallyVerified,
      canAccessProduct: true,
    });
  };
}
