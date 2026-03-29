import type {
  BotCommandContract,
} from "@pacifica/contracts";

export type ExecuteBotRuntimeCommandInput = {
  walletAddress: string;
  requestedBy: string;
  nowIso: string;
  idempotencyKey: string;
};

export type ExecuteCloseTradeCommandInput = ExecuteBotRuntimeCommandInput & {
  tradeId: string;
};

export interface BotCommandRepository {
  pauseBot(input: ExecuteBotRuntimeCommandInput): Promise<BotCommandContract | null>;
  resumeBot(input: ExecuteBotRuntimeCommandInput): Promise<BotCommandContract | null>;
  closeTrade(input: ExecuteCloseTradeCommandInput): Promise<BotCommandContract | null>;
}
