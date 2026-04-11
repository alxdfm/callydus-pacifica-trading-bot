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
      runtime: session.runtime,
      marketInfo: session.marketInfo,
      yourStrategy: session.yourStrategy,
    }),
  );
}
