import {
  operationalSessionSnapshotRequestSchema,
  operationalSessionSnapshotResponseSchema,
  type OperationalSessionSnapshotResponse,
} from "@pacifica/contracts";
import type {
  GetOperationalSessionByWalletInput,
  GetOperationalSessionByWalletOutput,
} from "../../../application/get-operational-session-by-wallet/GetOperationalSessionByWallet";

export type GetOperationalSessionByWalletHttpRequest = {
  body: GetOperationalSessionByWalletInput;
};

export type GetOperationalSessionByWalletHandler = (
  input: GetOperationalSessionByWalletInput,
) => Promise<GetOperationalSessionByWalletOutput>;

export function createGetOperationalSessionByWalletRoute(
  handler: GetOperationalSessionByWalletHandler,
) {
  return async function handleGetOperationalSessionByWallet(
    request: GetOperationalSessionByWalletHttpRequest,
  ): Promise<OperationalSessionSnapshotResponse> {
    const body = operationalSessionSnapshotRequestSchema.parse(request.body);
    const result = await handler(body);

    if (!result.accountExists) {
      return operationalSessionSnapshotResponseSchema.parse({
        status: "not_found",
        walletAddress: result.walletAddress,
        accountExists: false,
        canAccessProduct: false,
      });
    }

    return operationalSessionSnapshotResponseSchema.parse({
      status: "found",
      walletAddress: result.session.walletAddress,
      accountExists: true,
      onboardingStatus: result.session.onboardingStatus,
      credentialId: result.session.credentialId,
      agentWalletPublicKey: result.session.agentWalletPublicKey,
      credentialAlias: result.session.credentialAlias,
      keyFingerprint: result.session.keyFingerprint,
      builderApproved: result.session.builderApproved,
      operationallyVerified: result.session.operationallyVerified,
      activePreset: result.session.activePreset,
      runtime: result.session.runtime,
      recentEvents: result.session.recentEvents,
      canAccessProduct: result.session.canAccessProduct,
    });
  };
}
