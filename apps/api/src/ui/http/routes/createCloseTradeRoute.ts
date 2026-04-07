import {
  botCommandResponseSchema,
  closeTradeCommandRequestSchema,
  type BotCommandResponse,
  type CloseTradeCommandRequest,
} from "@pacifica/contracts";

type CloseTradeHttpRequest = {
  body: CloseTradeCommandRequest;
};

export type CloseTradeHandler = (
  input: CloseTradeCommandRequest,
) => Promise<BotCommandResponse>;

export function createCloseTradeRoute(handler: CloseTradeHandler) {
  return async function handleCloseTrade(
    request: CloseTradeHttpRequest,
  ): Promise<BotCommandResponse> {
    const body = closeTradeCommandRequestSchema.parse(request.body);
    const result = await handler(body);
    return botCommandResponseSchema.parse(result);
  };
}
