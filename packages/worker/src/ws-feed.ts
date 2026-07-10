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
  setSymbols(next: string[]): void;
} {
  const logger = input.logger ?? defaultLogger;
  let ws: WebSocket | null = null;
  let stopped = false;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let reconnectAttempt = 0;
  let symbols = [...new Set(input.symbols)];
  // Último update recebido por par — o candle anterior é considerado fechado
  // quando chega um update com openTime mais novo (o WS não tem flag isClosed)
  const pendingByKey = new Map<string, Candle>();

  function subscribeTo(socket: WebSocket, targetSymbols: string[]) {
    for (const symbol of targetSymbols) {
      for (const interval of input.intervals) {
        // Formato validado contra o WS real: method/params com source "candle"
        socket.send(
          JSON.stringify({
            method: "subscribe",
            params: { source: "candle", symbol, interval },
          }),
        );
      }
    }
  }

  function connect() {
    if (stopped) return;

    const socket = new WebSocket(input.wsUrl);
    ws = socket;

    socket.on("open", () => {
      reconnectAttempt = 0;
      logger.info("[ws-feed] connected", { url: input.wsUrl, symbols });

      subscribeTo(socket, symbols);
      void warmUpBuffers(symbols);
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

    const msg = message as { channel?: unknown; data?: unknown };

    // Formato real: { channel: "candle", data: { t,T,s,i,o,c,h,l,v } }
    if (msg.channel !== "candle" || !msg.data || typeof msg.data !== "object") {
      return;
    }

    const k = msg.data as Record<string, unknown>;
    const symbol = String(k.s ?? "").trim();
    const interval = String(k.i ?? "").trim() as CandleInterval;

    if (!symbol || !interval) return;

    const candle: Candle = {
      symbol,
      interval,
      openTime: Number(k.t),
      closeTime: Number(k.T),
      open: Number(k.o),
      high: Number(k.h),
      low: Number(k.l),
      close: Number(k.c),
      volume: Number(k.v ?? 0),
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

    const key = `${symbol}_${interval}`;
    const pending = pendingByKey.get(key);

    if (pending && pending.openTime < candle.openTime) {
      // Chegou candle novo — o anterior fechou e entra no buffer,
      // preservando a semântica do backtest (avaliação só em candle fechado)
      input.buffer.push(symbol, interval, pending);
    }

    pendingByKey.set(key, candle);
  }

  function intervalToMs(interval: string): number {
    const match = interval.match(/^(\d+)([mh])$/);
    if (!match) return 300_000;
    const value = Number(match[1]);
    return match[2] === "h" ? value * 3_600_000 : value * 60_000;
  }

  async function warmUpBuffers(targetSymbols: string[]) {
    const restBaseUrl = input.restBaseUrl.replace(/\/+$/, "");
    const WARMUP_CANDLE_COUNT = 300;

    for (const symbol of targetSymbols) {
      for (const interval of input.intervals) {
        try {
          // /api/v1/kline exige start_time; o range cobre as N velas do warm-up
          const endTime = Date.now();
          const params = new URLSearchParams({
            symbol,
            interval,
            start_time: String(endTime - WARMUP_CANDLE_COUNT * intervalToMs(interval)),
            end_time: String(endTime),
          });
          const response = await fetch(
            `${restBaseUrl}/api/v1/kline?${params.toString()}`,
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
    setSymbols(next: string[]) {
      const nextSymbols = [...new Set(next)];
      const added = nextSymbols.filter((symbol) => !symbols.includes(symbol));
      symbols = nextSymbols;

      if (added.length === 0) return;

      logger.info("[ws-feed] symbols updated", { symbols, added });

      if (ws !== null && ws.readyState === WebSocket.OPEN) {
        subscribeTo(ws, added);
        void warmUpBuffers(added);
      }
    },
  };
}
