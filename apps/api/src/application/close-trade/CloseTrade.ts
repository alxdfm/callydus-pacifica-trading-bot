import type {
  BotCommandResponse,
  CloseTradeCommandRequest,
} from "@pacifica/contracts";
import type { BotCommandRepository } from "../../domain/bot-commands/BotCommandRepository";

export type CloseTradeDependencies = {
  commandRepository: BotCommandRepository;
  now?: () => Date;
};

export function createCloseTrade(dependencies: CloseTradeDependencies) {
  const getNow = dependencies.now ?? (() => new Date());

  return async function closeTrade(
    input: CloseTradeCommandRequest,
  ): Promise<BotCommandResponse> {
    if (!input.walletAddress.trim()) {
      return {
        status: "error",
        code: "wallet_not_connected",
        message: "Connect the main wallet before closing a trade.",
        retryable: false,
      };
    }

    const nowIso = getNow().toISOString();
    const command = await dependencies.commandRepository.closeTrade({
      walletAddress: input.walletAddress,
      tradeId: input.tradeId,
      requestedBy: "app",
      nowIso,
      idempotencyKey: `close-trade:${input.tradeId}:${nowIso}`,
    });

    if (!command) {
      return {
        status: "error",
        code: "trade_not_found",
        message: "The selected trade could not be found for this account.",
        retryable: false,
      };
    }

    return {
      status: "success",
      command,
      message: "Trade close requested successfully.",
    };
  };
}
