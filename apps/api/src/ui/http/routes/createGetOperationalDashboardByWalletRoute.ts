import {
  operationalDashboardSessionResponseSchema,
  type OperationalDashboardSessionResponse,
} from "@pacifica/contracts";
import type { OperationalDashboardSession } from "../../../domain/operational-session/OperationalSession";
import type {
  GetOperationalSessionSliceByWalletInput,
  GetOperationalSessionSliceByWalletOutput,
} from "../../../application/get-operational-session-slice-by-wallet/GetOperationalSessionSliceByWallet";
import { createOperationalSessionSliceRoute } from "./createOperationalSessionSliceRoute";

export type GetOperationalDashboardByWalletHandler = (
  input: GetOperationalSessionSliceByWalletInput,
) => Promise<GetOperationalSessionSliceByWalletOutput<OperationalDashboardSession>>;

export function createGetOperationalDashboardByWalletRoute(
  handler: GetOperationalDashboardByWalletHandler,
) {
  return createOperationalSessionSliceRoute(
    handler,
    operationalDashboardSessionResponseSchema,
    (session): OperationalDashboardSessionResponse => ({
      status: "found",
      walletAddress: session.walletAddress,
      accountExists: true,
      onboardingStatus: session.onboardingStatus,
      builderApproved: session.builderApproved,
      operationallyVerified: session.operationallyVerified,
      activePreset: session.activePreset,
      runtime: session.runtime,
      recentEvents: session.recentEvents,
      canAccessProduct: session.canAccessProduct,
    }),
  );
}
