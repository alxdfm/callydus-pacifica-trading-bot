import type {
  BotCommandResponse,
  BotRuntimeCommandRequest,
} from "@pacifica/contracts";
import type { BotCommandRepository } from "../../domain/bot-commands/BotCommandRepository";
import type { OperationalEventRepository } from "../../domain/operational-events/OperationalEventRepository";

export type ResumeBotDependencies = {
  commandRepository: BotCommandRepository;
  eventRepository?: OperationalEventRepository;
  now?: () => Date;
};

/**
 * Creates the resume-bot command use case.
 *
 * Responsibility:
 * - validate wallet presence
 * - issue a tracked resume command through the command repository
 */
export function createResumeBot(dependencies: ResumeBotDependencies) {
  const getNow = dependencies.now ?? (() => new Date());

  /**
   * Requests that the paused bot runtime resume for the account.
   */
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
      idempotencyKey: `resume-bot:${input.walletAddress}`,
    });

    if (!command) {
      await dependencies.eventRepository?.appendOperationalEvent({
        walletAddress: input.walletAddress,
        eventType: "bot_command",
        severity: "warning",
        title: "Resume bot failed",
        message: "Could not resolve an operational account for this wallet.",
        payloadJson: {
          commandType: "resume_bot",
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
      title: "Bot resumed",
      message: "Resume bot command completed successfully.",
      payloadJson: {
        commandId: command.id,
        commandType: "resume_bot",
      },
    });

    return {
      status: "success",
      command,
      message: "Bot resumed successfully.",
    };
  };
}
