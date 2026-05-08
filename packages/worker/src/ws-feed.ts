import type { Candle, CandleInterval } from "@pacifica/shared";
import { WebSocket } from "ws";
import type { CandleBuffer } from "./candle-buffer.js";

type WsFeedLogger = {
  info: (...a: unknown[]) => void;
  error: (...a: unknown[]) => void;
};

type WsFeedInput = {
  wsUrl: string;
  restBaseUrl: string;
  symbols: string[];
  intervals: CandleInterval[];
  buffer: CandleBuffer;
  onWarm?: (symbol: string, interval: CandleInterval) => void;
  logger?: WsFeedLogger;
};

const defaultLogger: WsFeedLogger = {
  info: (...a) => console.info(...a),
  error: (...a) => console.error(...a),
};

export function createWsFeed(input: WsFeedInput): {
  start(): void;
  stop(): void;
} {
  const logger = input.logger ?? defaultLogger;
  let ws: WebSocket | null = null;
  let stopped = false;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let reconnectAttempt = 0;

  function connect() {
    if (stopped) return;

    const socket = new WebSocket(input.wsUrl);
    ws = socket;

    socket.on("open", () => {
      reconnectAttempt = 0;
      logger.info("[ws-feed] connected", { url: input.wsUrl });

      // Subscribe to candle streams for each symbol/interval combination
      for (const symbol of input.symbols) {
        for (const interval of input.intervals) {
          const subscribeMessage = JSON.stringify({
            op: "subscribe",
            channel: "kline",
            symbol,
            interval,
          });
          socket.send(subscribeMessage);
        }
      }

      // Warm up buffers via REST for all symbol/interval pairs
      void warmUpBuffers();
    });

    socket.on("message", (data) => {
      try {
        const raw = typeof data === "string" ? data : data.toString("utf8");
        const message = JSON.parse(raw) as unknown;
        handleMessage(message);
      } catch {
        // Ignore malformed messages
      }
    });

    socket.on("error", (err) => {
      logger.error("[ws-feed] socket error", err);
    });

    socket.on("close", () => {
      logger.info("[ws-feed] connection closed");
      ws = null;
      scheduleReconnect();
    });
  }

  function handleMessage(message: unknown) {
    if (!message || typeof message !== "object") return;

    const msg = message as Record<string, unknown>;

    // Typical Pacifica WS candle message shape — adjust field names as needed
    const channel = msg.channel ?? msg.type ?? msg.e;
    if (channel !== "kline" && channel !== "candlestick") return;

    const kline = msg.k ?? msg.data ?? msg.kline;
    if (!kline || typeof kline !== "object") return;

    const k = kline as Record<string, unknown>;
    const isClosed = Boolean(k.x ?? k.isClosed ?? k.is_closed ?? false);

    if (!isClosed) return;

    const symbol = String(msg.symbol ?? msg.s ?? k.s ?? "").trim();
    const intervalRaw = String(k.i ?? msg.interval ?? "").trim();
    const interval = intervalRaw as CandleInterval;

    if (!symbol || !interval) return;

    const candle: Candle = {
      symbol,
      interval,
      openTime: Number(k.t ?? k.openTime ?? k.open_time),
      closeTime: Number(k.T ?? k.closeTime ?? k.close_time),
      open: Number(k.o ?? k.open),
      high: Number(k.h ?? k.high),
      low: Number(k.l ?? k.low),
      close: Number(k.c ?? k.close),
      volume: Number(k.v ?? k.volume ?? 0),
    };

    if (
      !Number.isFinite(candle.openTime) ||
      !Number.isFinite(candle.closeTime) ||
      !Number.isFinite(candle.open) ||
      !Number.isFinite(candle.high) ||
      !Number.isFinite(candle.low) ||
      !Number.isFinite(candle.close)
    ) {
      return;
    }

    input.buffer.push(symbol, interval, candle);
  }

  async function warmUpBuffers() {
    const restBaseUrl = input.restBaseUrl.replace(/\/+$/, "");

    for (const symbol of input.symbols) {
      for (const interval of input.intervals) {
        try {
          const params = new URLSearchParams({
            symbol,
            interval,
            limit: "300",
          });
          const response = await fetch(
            `${restBaseUrl}/api/v1/klines?${params.toString()}`,
            { headers: { Accept: "application/json" } },
          );

          if (!response.ok) {
            logger.error("[ws-feed] warm-up REST failed", {
              symbol,
              interval,
              status: response.status,
            });
            continue;
          }

          const payload = await response.json() as unknown;
          const data =
            payload && typeof payload === "object" && "data" in payload
              ? (payload as { data?: unknown }).data
              : payload;

          if (!Array.isArray(data)) continue;

          for (const item of data) {
            if (!item || typeof item !== "object") continue;

            const row = item as Record<string, unknown>;
            const candle: Candle = {
              symbol,
              interval,
              openTime: Number(row.openTime ?? row.open_time ?? row.t),
              closeTime: Number(row.closeTime ?? row.close_time ?? row.T),
              open: Number(row.open ?? row.o),
              high: Number(row.high ?? row.h),
              low: Number(row.low ?? row.l),
              close: Number(row.close ?? row.c),
              volume: Number(row.volume ?? row.v ?? 0),
            };

            if (
              Number.isFinite(candle.openTime) &&
              Number.isFinite(candle.closeTime) &&
              Number.isFinite(candle.open) &&
              Number.isFinite(candle.high) &&
              Number.isFinite(candle.low) &&
              Number.isFinite(candle.close)
            ) {
              input.buffer.push(symbol, interval, candle);
            }
          }

          logger.info("[ws-feed] warm-up complete", {
            symbol,
            interval,
            candles: input.buffer.get(symbol, interval).length,
          });

          if (input.onWarm && input.buffer.isWarm(symbol, interval)) {
            input.onWarm(symbol, interval);
          }
        } catch (err) {
          logger.error("[ws-feed] warm-up error", { symbol, interval, err });
        }
      }
    }
  }

  function scheduleReconnect() {
    if (stopped) return;

    const baseDelayMs = 1_000;
    const maxDelayMs = 60_000;
    const delay = Math.min(
      baseDelayMs * Math.pow(2, reconnectAttempt),
      maxDelayMs,
    );
    reconnectAttempt += 1;

    logger.info("[ws-feed] reconnecting", {
      attempt: reconnectAttempt,
      delayMs: delay,
    });

    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      connect();
    }, delay);
  }

  return {
    start() {
      stopped = false;
      connect();
    },
    stop() {
      stopped = true;
      if (reconnectTimer !== null) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
      if (ws !== null) {
        ws.close();
        ws = null;
      }
    },
  };
}
