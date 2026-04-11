import {
  operationalHistorySessionResponseSchema,
  type OperationalHistorySessionResponse,
} from "@pacifica/contracts";
import type { OperationalHistorySession } from "../../../domain/operational-session/OperationalSession";
import type {
  GetOperationalSessionSliceByWalletInput,
  GetOperationalSessionSliceByWalletOutput,
} from "../../../application/get-operational-session-slice-by-wallet/GetOperationalSessionSliceByWallet";
import { createOperationalSessionSliceRoute } from "./createOperationalSessionSliceRoute";

export type GetOperationalHistoryByWalletHandler = (
  input: GetOperationalSessionSliceByWalletInput,
) => Promise<GetOperationalSessionSliceByWalletOutput<OperationalHistorySession>>;

export function createGetOperationalHistoryByWalletRoute(
  handler: GetOperationalHistoryByWalletHandler,
) {
  return createOperationalSessionSliceRoute(
    handler,
    operationalHistorySessionResponseSchema,
    (session): OperationalHistorySessionResponse => ({
      status: "found",
      runtime: session.runtime,
    }),
  );
}
