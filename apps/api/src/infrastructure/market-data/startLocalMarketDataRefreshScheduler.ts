import type { MarketCandleInterval, MarketCandleRequest } from "@pacifica/contracts";
import {
  alignToLastClosedCandleEndTime,
  intervalToMilliseconds,
} from "./candleWindow";

type RefreshHandler = (input: {
  refreshPrices?: boolean;
  refreshMarketInfo?: boolean;
  candleRequests?: MarketCandleRequest[];
}) => Promise<unknown>;

type LocalSchedulerLogger = {
  info: (message: string, payload?: Record<string, unknown>) => void;
  warn: (message: string, payload?: Record<string, unknown>) => void;
  error: (message: string, payload?: Record<string, unknown>) => void;
};

export type SchedulerCandleRequestConfig = {
  symbol: string;
  interval: MarketCandleInterval;
  priceSource?: "market" | "mark";
  startTime?: number;
  endTime?: number;
  limit?: number;
};

type CandleRequestResolver = () => Promise<SchedulerCandleRequestConfig[]>;

export type LocalMarketDataRefreshSchedulerConfig = {
  enabled: boolean;
  intervalMs: number;
  runOnStart: boolean;
  refreshPrices: boolean;
  refreshMarketInfo: boolean;
};

const defaultLogger: LocalSchedulerLogger = {
  info(message, payload) {
    console.info(message, payload ?? {});
  },
  warn(message, payload) {
    console.warn(message, payload ?? {});
  },
  error(message, payload) {
    console.error(message, payload ?? {});
  },
};

export function startLocalMarketDataRefreshScheduler(input: {
  config: LocalMarketDataRefreshSchedulerConfig;
  refreshMarketData: RefreshHandler;
  resolveCandleRequests?: CandleRequestResolver;
  now?: () => Date;
  logger?: LocalSchedulerLogger;
}) {
  const logger = input.logger ?? defaultLogger;
  const now = input.now ?? (() => new Date());

  if (!input.config.enabled) {
    logger.info("local_market_data_refresh_scheduler.disabled");
    return {
      stop() {},
    };
  }

  let running = false;
  const run = async (trigger: "startup" | "interval") => {
    if (running) {
      logger.warn("local_market_data_refresh_scheduler.skipped_already_running", {
        trigger,
      });
      return;
    }

    running = true;
    const startedAt = now();

    try {
      const candleRequests = input.resolveCandleRequests
        ? normalizeResolvedCandleRequests(
            await input.resolveCandleRequests(),
            startedAt,
          )
        : [];
      const result = await input.refreshMarketData({
        ...(input.config.refreshPrices ? { refreshPrices: true } : {}),
        ...(input.config.refreshMarketInfo ? { refreshMarketInfo: true } : {}),
        ...(candleRequests.length > 0 ? { candleRequests } : {}),
      });

      logger.info("local_market_data_refresh_scheduler.completed", {
        trigger,
        startedAtIso: startedAt.toISOString(),
        candleRequestCount: candleRequests.length,
        result,
      });
    } catch (error) {
      logger.error("local_market_data_refresh_scheduler.failed", {
        trigger,
        startedAtIso: startedAt.toISOString(),
        errorMessage: error instanceof Error ? error.message : String(error),
      });
    } finally {
      running = false;
    }
  };

  if (input.config.runOnStart) {
    void run("startup");
  }

  const timer = setInterval(() => {
    void run("interval");
  }, input.config.intervalMs);

  return {
    stop() {
      clearInterval(timer);
    },
  };
}

export function readLocalMarketDataRefreshSchedulerConfigFromEnv(env: NodeJS.ProcessEnv) {
  return {
    enabled: booleanFromEnv(env.LOCAL_MARKET_DATA_REFRESH_ENABLED, false),
    intervalMs: numberFromEnv(env.LOCAL_MARKET_DATA_REFRESH_INTERVAL_MS, 60_000),
    runOnStart: booleanFromEnv(env.LOCAL_MARKET_DATA_REFRESH_RUN_ON_START, true),
    refreshPrices: booleanFromEnv(env.LOCAL_MARKET_DATA_REFRESH_PRICES, true),
    refreshMarketInfo: booleanFromEnv(
      env.LOCAL_MARKET_DATA_REFRESH_MARKET_INFO,
      true,
    ),
  } satisfies LocalMarketDataRefreshSchedulerConfig;
}

function normalizeResolvedCandleRequests(
  requests: SchedulerCandleRequestConfig[],
  referenceTime: Date,
) {
  return requests.map((request) =>
    normalizeCandleRequestConfig(
      {
        symbol: request.symbol,
        interval: request.interval,
        ...(request.priceSource ? { priceSource: request.priceSource } : {}),
        ...(typeof request.startTime === "number"
          ? { startTime: request.startTime }
          : {}),
        ...(typeof request.endTime === "number" ? { endTime: request.endTime } : {}),
        ...(typeof request.limit === "number" ? { limit: request.limit } : {}),
      },
      referenceTime,
    ),
  );
}

export function normalizeCandleRequestConfig(
  request: SchedulerCandleRequestConfig,
  referenceTime: Date,
): MarketCandleRequest {
  const intervalMs = intervalToMilliseconds(request.interval);
  const limit = request.limit ?? 120;
  const endTime =
    typeof request.endTime === "number"
      ? request.endTime
      : alignToLastClosedCandleEndTime(referenceTime.getTime(), request.interval);
  const startTime =
    typeof request.startTime === "number"
      ? request.startTime
      : endTime - intervalMs * limit;

  return {
    symbol: request.symbol,
    interval: request.interval,
    priceSource: request.priceSource ?? "market",
    startTime,
    endTime,
    limit,
  };
}

function booleanFromEnv(value: string | undefined, fallback: boolean) {
  if (value === undefined) {
    return fallback;
  }

  return value === "true";
}

function numberFromEnv(value: string | undefined, fallback: number) {
  if (value === undefined || value.trim() === "") {
    return fallback;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : fallback;
}
