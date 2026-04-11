import {
  operationalProfileSessionResponseSchema,
  type OperationalProfileSessionResponse,
} from "@pacifica/contracts";
import type { OperationalProfileSession } from "../../../domain/operational-session/OperationalSession";
import type {
  GetOperationalSessionSliceByWalletInput,
  GetOperationalSessionSliceByWalletOutput,
} from "../../../application/get-operational-session-slice-by-wallet/GetOperationalSessionSliceByWallet";
import { createOperationalSessionSliceRoute } from "./createOperationalSessionSliceRoute";

export type GetOperationalProfileByWalletHandler = (
  input: GetOperationalSessionSliceByWalletInput,
) => Promise<GetOperationalSessionSliceByWalletOutput<OperationalProfileSession>>;

export function createGetOperationalProfileByWalletRoute(
  handler: GetOperationalProfileByWalletHandler,
) {
  return createOperationalSessionSliceRoute(
    handler,
    operationalProfileSessionResponseSchema,
    (session): OperationalProfileSessionResponse => ({
      status: "found",
      walletAddress: session.walletAddress,
      accountExists: true,
      onboardingStatus: session.onboardingStatus,
      credentialId: session.credentialId,
      agentWalletPublicKey: session.agentWalletPublicKey,
      credentialAlias: session.credentialAlias,
      keyFingerprint: session.keyFingerprint,
      builderApproved: session.builderApproved,
      operationallyVerified: session.operationallyVerified,
      activePreset: session.activePreset,
      runtime: session.runtime,
      canAccessProduct: session.canAccessProduct,
    }),
  );
}
