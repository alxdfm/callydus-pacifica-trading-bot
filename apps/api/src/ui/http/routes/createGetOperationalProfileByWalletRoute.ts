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
      builderApproved: session.builderApproved,
      operationallyVerified: session.operationallyVerified,
      credentialId: session.credentialId,
      agentWalletPublicKey: session.agentWalletPublicKey,
      credentialAlias: session.credentialAlias,
      keyFingerprint: session.keyFingerprint,
      runtime: session.runtime,
    }),
  );
}
