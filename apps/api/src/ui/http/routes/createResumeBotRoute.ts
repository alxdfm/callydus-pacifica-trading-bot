import {
  botCommandResponseSchema,
  botRuntimeCommandRequestSchema,
  type BotCommandResponse,
  type BotRuntimeCommandRequest,
} from "@pacifica/contracts";

export type ResumeBotHttpRequest = {
  body: BotRuntimeCommandRequest;
};

export type ResumeBotHandler = (
  input: BotRuntimeCommandRequest,
) => Promise<BotCommandResponse>;

export function createResumeBotRoute(handler: ResumeBotHandler) {
  return async function handleResumeBot(
    request: ResumeBotHttpRequest,
  ): Promise<BotCommandResponse> {
    const body = botRuntimeCommandRequestSchema.parse(request.body);
    const result = await handler(body);
    return botCommandResponseSchema.parse(result);
  };
}
