import {
  saveYourStrategyRequestSchema,
  saveYourStrategyResponseSchema,
  type SaveYourStrategyRequest,
  type SaveYourStrategyResponse,
} from "@pacifica/contracts";

type SaveYourStrategyHttpRequest = {
  body: SaveYourStrategyRequest;
};

export type SaveYourStrategyHandler = (
  input: SaveYourStrategyRequest,
) => Promise<SaveYourStrategyResponse>;

export function createSaveYourStrategyRoute(
  handler: SaveYourStrategyHandler,
) {
  return async function handleSaveYourStrategy(
    request: SaveYourStrategyHttpRequest,
  ): Promise<SaveYourStrategyResponse> {
    const body = saveYourStrategyRequestSchema.parse(request.body);
    const result = await handler(body);
    return saveYourStrategyResponseSchema.parse(result);
  };
}
