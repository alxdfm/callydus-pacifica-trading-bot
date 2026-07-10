import type { DrizzleDb } from "./db/client.js";
import { getActiveStrategies, type Strategy } from "./db/queries.js";

type DbWatcherLogger = {
  info: (...a: unknown[]) => void;
  error: (...a: unknown[]) => void;
};

type DbWatcherInput = {
  db: DrizzleDb;
  pollIntervalMs?: number;
  onStrategiesChanged: (strategies: Strategy[]) => void;
  logger?: DbWatcherLogger;
};

const defaultLogger: DbWatcherLogger = {
  info: (...a) => console.info(...a),
  error: (...a) => console.error(...a),
};

export function createDbWatcher(input: DbWatcherInput): {
  start(): void;
  stop(): void;
} {
  const logger = input.logger ?? defaultLogger;
  const pollIntervalMs = input.pollIntervalMs ?? 30_000;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let stopped = false;
  let previousSignature = "";

  async function poll() {
    try {
      const strategies = await getActiveStrategies(input.db);
      // updatedAt na assinatura: edições de config com a strategy ativa
      // também precisam propagar, não só entrada/saída do conjunto
      const signature = strategies
        .map((s) => `${s.id}:${s.updatedAt.getTime()}`)
        .sort()
        .join("|");

      if (signature !== previousSignature) {
        previousSignature = signature;
        logger.info("[db-watcher] strategies changed", {
          count: strategies.length,
        });
        input.onStrategiesChanged(strategies);
      }
    } catch (err) {
      logger.error("[db-watcher] poll error", err);
    }

    if (!stopped) {
      timer = setTimeout(() => {
        void poll();
      }, pollIntervalMs);
    }
  }

  return {
    start() {
      stopped = false;
      // TODO: Future: use LISTEN/NOTIFY from Postgres
      void poll();
    },
    stop() {
      stopped = true;
      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
    },
  };
}
