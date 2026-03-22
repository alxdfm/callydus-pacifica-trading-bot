import type { BotCommandContract, CommandType } from "@pacifica/contracts";

export type WorkerJob = {
  commandId: string;
  commandType: CommandType;
};

export function mapCommandToWorkerJob(command: BotCommandContract): WorkerJob {
  return {
    commandId: command.id,
    commandType: command.commandType,
  };
}
