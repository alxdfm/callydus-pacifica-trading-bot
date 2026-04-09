import {
  yourStrategyBacktestPreviewRequestSchema,
  yourStrategyBacktestPreviewResponseSchema,
  type YourStrategyBacktestPreviewRequest,
  type YourStrategyBacktestPreviewResponse,
} from "@pacifica/contracts";

type PreviewYourStrategyBacktestHttpRequest = {
  body: YourStrategyBacktestPreviewRequest;
};

export type PreviewYourStrategyBacktestHandler = (
  input: YourStrategyBacktestPreviewRequest,
) => Promise<YourStrategyBacktestPreviewResponse>;

export function createPreviewYourStrategyBacktestRoute(
  handler: PreviewYourStrategyBacktestHandler,
) {
  return async function handlePreviewYourStrategyBacktest(
    request: PreviewYourStrategyBacktestHttpRequest,
  ): Promise<YourStrategyBacktestPreviewResponse> {
    const body = yourStrategyBacktestPreviewRequestSchema.parse(request.body);
    const result = await handler(body);
    return yourStrategyBacktestPreviewResponseSchema.parse(result);
  };
}
