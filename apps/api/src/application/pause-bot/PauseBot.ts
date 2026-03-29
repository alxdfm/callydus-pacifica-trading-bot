import type {
  BotCommandResponse,
  BotRuntimeCommandRequest,
} from "@pacifica/contracts";
import type { BotCommandRepository } from "../../domain/bot-commands/BotCommandRepository";

export type PauseBotDependencies = {
  commandRepository: BotCommandRepository;
  now?: () => Date;
};

/**
 * Creates the pause-bot command use case.
 *
 * Responsibility:
 * - validate wallet presence
 * - issue a tracked pause command through the command repository
 */
export function createPauseBot(dependencies: PauseBotDependencies) {
  const getNow = dependencies.now ?? (() => new Date());

  /**
   * Requests that the active bot runtime be paused for the account.
   */
  return async function pauseBot(
    input: BotRuntimeCommandRequest,
  ): Promise<BotCommandResponse> {
    if (!input.walletAddress.trim()) {
      return {
        status: "error",
        code: "wallet_not_connected",
        message: "Connect the main wallet before pausing the bot.",
        retryable: false,
      };
    }

    const nowIso = getNow().toISOString();
    const command = await dependencies.commandRepository.pauseBot({
      walletAddress: input.walletAddress,
      requestedBy: "app",
      nowIso,
      idempotencyKey: `pause-bot:${input.walletAddress}:${nowIso}`,
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
      message: "Bot paused successfully.",
    };
  };
}
