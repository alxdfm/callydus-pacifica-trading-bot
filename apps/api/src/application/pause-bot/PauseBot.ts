import type {
  BotCommandResponse,
  BotRuntimeCommandRequest,
} from "@pacifica/contracts";
import type { BotCommandRepository } from "../../domain/bot-commands/BotCommandRepository";
import type { OperationalEventRepository } from "../../domain/operational-events/OperationalEventRepository";

export type PauseBotDependencies = {
  commandRepository: BotCommandRepository;
  eventRepository?: OperationalEventRepository;
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
      idempotencyKey: `pause-bot:${input.walletAddress}`,
    });

    if (!command) {
      await dependencies.eventRepository?.appendOperationalEvent({
        walletAddress: input.walletAddress,
        eventType: "bot_command",
        severity: "warning",
        title: "Pause bot failed",
        message: "Could not resolve an operational account for this wallet.",
        payloadJson: {
          commandType: "pause_bot",
        },
      });
      return {
        status: "error",
        code: "account_not_ready",
        message: "Could not resolve an operational account for this wallet.",
        retryable: false,
      };
    }

    await dependencies.eventRepository?.appendOperationalEvent({
      walletAddress: input.walletAddress,
      eventType: "bot_command",
      severity: "info",
      title: "Bot paused",
      message: "Pause bot command completed successfully.",
      payloadJson: {
        commandId: command.id,
        commandType: "pause_bot",
      },
    });

    return {
      status: "success",
      command,
      message: "Bot paused successfully.",
    };
  };
}
