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
  let previousIds = new Set<string>();

  async function poll() {
    try {
      const strategies = await getActiveStrategies(input.db);
      const currentIds = new Set(strategies.map((s) => s.id));

      const changed =
        currentIds.size !== previousIds.size ||
        [...currentIds].some((id) => !previousIds.has(id)) ||
        [...previousIds].some((id) => !currentIds.has(id));

      if (changed) {
        previousIds = currentIds;
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
