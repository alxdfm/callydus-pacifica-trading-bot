import {
  operationalTradesSessionResponseSchema,
  type OperationalTradesSessionResponse,
} from "@pacifica/contracts";
import type { OperationalTradesSession } from "../../../domain/operational-session/OperationalSession";
import type {
  GetOperationalSessionSliceByWalletInput,
  GetOperationalSessionSliceByWalletOutput,
} from "../../../application/get-operational-session-slice-by-wallet/GetOperationalSessionSliceByWallet";
import { createOperationalSessionSliceRoute } from "./createOperationalSessionSliceRoute";

export type GetOperationalTradesByWalletHandler = (
  input: GetOperationalSessionSliceByWalletInput,
) => Promise<GetOperationalSessionSliceByWalletOutput<OperationalTradesSession>>;

export function createGetOperationalTradesByWalletRoute(
  handler: GetOperationalTradesByWalletHandler,
) {
  return createOperationalSessionSliceRoute(
    handler,
    operationalTradesSessionResponseSchema,
    (session): OperationalTradesSessionResponse => ({
      status: "found",
      walletAddress: session.walletAddress,
      accountExists: true,
      onboardingStatus: session.onboardingStatus,
      builderApproved: session.builderApproved,
      operationallyVerified: session.operationallyVerified,
      activePreset: session.activePreset,
      runtime: session.runtime,
      canAccessProduct: session.canAccessProduct,
    }),
  );
}
