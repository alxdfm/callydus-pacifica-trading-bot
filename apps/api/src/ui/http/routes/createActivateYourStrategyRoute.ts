import {
  activateYourStrategyRequestSchema,
  activateYourStrategyResponseSchema,
  type ActivateYourStrategyRequest,
  type ActivateYourStrategyResponse,
} from "@pacifica/contracts";

type ActivateYourStrategyHttpRequest = {
  body: ActivateYourStrategyRequest;
};

export type ActivateYourStrategyHandler = (
  input: ActivateYourStrategyRequest,
) => Promise<ActivateYourStrategyResponse>;

export function createActivateYourStrategyRoute(
  handler: ActivateYourStrategyHandler,
) {
  return async function handleActivateYourStrategy(
    request: ActivateYourStrategyHttpRequest,
  ): Promise<ActivateYourStrategyResponse> {
    const body = activateYourStrategyRequestSchema.parse(request.body);
    const result = await handler(body);
    return activateYourStrategyResponseSchema.parse(result);
  };
}
