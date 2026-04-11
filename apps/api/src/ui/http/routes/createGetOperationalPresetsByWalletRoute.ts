import {
  operationalPresetsSessionResponseSchema,
  type OperationalPresetsSessionResponse,
} from "@pacifica/contracts";
import type { OperationalPresetsSession } from "../../../domain/operational-session/OperationalSession";
import type {
  GetOperationalSessionSliceByWalletInput,
  GetOperationalSessionSliceByWalletOutput,
} from "../../../application/get-operational-session-slice-by-wallet/GetOperationalSessionSliceByWallet";
import { createOperationalSessionSliceRoute } from "./createOperationalSessionSliceRoute";

export type GetOperationalPresetsByWalletHandler = (
  input: GetOperationalSessionSliceByWalletInput,
) => Promise<GetOperationalSessionSliceByWalletOutput<OperationalPresetsSession>>;

export function createGetOperationalPresetsByWalletRoute(
  handler: GetOperationalPresetsByWalletHandler,
) {
  return createOperationalSessionSliceRoute(
    handler,
    operationalPresetsSessionResponseSchema,
    (session): OperationalPresetsSessionResponse => ({
      status: "found",
      walletAddress: session.walletAddress,
      accountExists: true,
      onboardingStatus: session.onboardingStatus,
      builderApproved: session.builderApproved,
      operationallyVerified: session.operationallyVerified,
      activePreset: session.activePreset,
      runtime: session.runtime,
      marketInfo: session.marketInfo,
      yourStrategy: session.yourStrategy,
      canAccessProduct: session.canAccessProduct,
    }),
  );
}
