import { operationalSessionSnapshotRequestSchema } from "@pacifica/contracts";
import type {
  GetOperationalSessionSliceByWalletInput,
  GetOperationalSessionSliceByWalletOutput,
} from "../../../application/get-operational-session-slice-by-wallet/GetOperationalSessionSliceByWallet";

type OperationalSessionSliceHttpRequest = {
  body: GetOperationalSessionSliceByWalletInput;
};

type ParseSchema<T> = {
  parse: (value: unknown) => T;
};

export function createOperationalSessionSliceRoute<TSession, TResponse>(
  handler: (
    input: GetOperationalSessionSliceByWalletInput,
  ) => Promise<GetOperationalSessionSliceByWalletOutput<TSession>>,
  responseSchema: ParseSchema<TResponse>,
  mapFoundResponse: (session: TSession) => Record<string, unknown>,
) {
  return async function handleOperationalSessionSlice(
    request: OperationalSessionSliceHttpRequest,
  ): Promise<TResponse> {
    const body = operationalSessionSnapshotRequestSchema.parse(request.body);
    const result = await handler(body);

    if (!result.accountExists) {
      return responseSchema.parse({
        status: "not_found",
        walletAddress: result.walletAddress,
        accountExists: false,
        canAccessProduct: false,
      });
    }

    return responseSchema.parse(mapFoundResponse(result.session));
  };
}
