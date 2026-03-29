import type {
  BotCommandResponse,
  BotRuntimeCommandRequest,
} from "@pacifica/contracts";
import type { BotCommandRepository } from "../../domain/bot-commands/BotCommandRepository";

export type ResumeBotDependencies = {
  commandRepository: BotCommandRepository;
  now?: () => Date;
};

export function createResumeBot(dependencies: ResumeBotDependencies) {
  const getNow = dependencies.now ?? (() => new Date());

  return async function resumeBot(
    input: BotRuntimeCommandRequest,
  ): Promise<BotCommandResponse> {
    if (!input.walletAddress.trim()) {
      return {
        status: "error",
        code: "wallet_not_connected",
        message: "Connect the main wallet before resuming the bot.",
        retryable: false,
      };
    }

    const nowIso = getNow().toISOString();
    const command = await dependencies.commandRepository.resumeBot({
      walletAddress: input.walletAddress,
      requestedBy: "app",
      nowIso,
      idempotencyKey: `resume-bot:${input.walletAddress}:${nowIso}`,
    });

    if (!command) {
      return {
        status: "error",
        code: "account_not_ready",
        message: "Could not resolve an operational account for this wallet.",
        retryable: false,
      };
    }

    return {
      status: "success",
      command,
      message: "Bot resumed successfully.",
    };
  };
}
