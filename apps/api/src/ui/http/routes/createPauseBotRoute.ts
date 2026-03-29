import {
  botCommandResponseSchema,
  botRuntimeCommandRequestSchema,
  type BotCommandResponse,
  type BotRuntimeCommandRequest,
} from "@pacifica/contracts";

export type PauseBotHttpRequest = {
  body: BotRuntimeCommandRequest;
};

export type PauseBotHandler = (
  input: BotRuntimeCommandRequest,
) => Promise<BotCommandResponse>;

export function createPauseBotRoute(handler: PauseBotHandler) {
  return async function handlePauseBot(
    request: PauseBotHttpRequest,
  ): Promise<BotCommandResponse> {
    const body = botRuntimeCommandRequestSchema.parse(request.body);
    const result = await handler(body);
    return botCommandResponseSchema.parse(result);
  };
}
