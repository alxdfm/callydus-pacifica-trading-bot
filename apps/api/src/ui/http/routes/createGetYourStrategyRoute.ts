import {
  getYourStrategyRequestSchema,
  getYourStrategyResponseSchema,
  type GetYourStrategyRequest,
  type GetYourStrategyResponse,
} from "@pacifica/contracts";

type GetYourStrategyHttpRequest = {
  body: GetYourStrategyRequest;
};

export type GetYourStrategyHandler = (
  input: GetYourStrategyRequest,
) => Promise<GetYourStrategyResponse>;

export function createGetYourStrategyRoute(
  handler: GetYourStrategyHandler,
) {
  return async function handleGetYourStrategy(
    request: GetYourStrategyHttpRequest,
  ): Promise<GetYourStrategyResponse> {
    const body = getYourStrategyRequestSchema.parse(request.body);
    const result = await handler(body);
    return getYourStrategyResponseSchema.parse(result);
  };
}
