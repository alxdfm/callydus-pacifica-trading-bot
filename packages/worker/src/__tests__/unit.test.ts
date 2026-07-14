import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { CandleInterval } from "@pacifica/shared";
import { CandleBuffer } from "../candle-buffer.js";

// ---------------------------------------------------------------------------
// ws-feed: o cross-product símbolo × intervalo é o que mantém o bot vivo — um
// par não assinado significa estratégia que nunca avalia, e em silêncio
// ---------------------------------------------------------------------------

type Handler = (...args: unknown[]) => void;

class FakeSocket {
  static instances: FakeSocket[] = [];
  static OPEN = 1;

  readyState = 0;
  sent: string[] = [];
  private handlers = new Map<string, Handler[]>();

  constructor(public url: string) {
    FakeSocket.instances.push(this);
  }

  on(event: string, handler: Handler) {
    const list = this.handlers.get(event) ?? [];
    list.push(handler);
    this.handlers.set(event, list);
  }

  send(payload: string) {
    this.sent.push(payload);
  }

  close() {
    this.emit("close");
  }

  emit(event: string, ...args: unknown[]) {
    for (const handler of this.handlers.get(event) ?? []) handler(...args);
  }

  open() {
    this.readyState = FakeSocket.OPEN;
    this.emit("open");
  }

  /** Pares assinados nesta conexão, como `SYMBOL_interval`. */
  subscriptions(): string[] {
    return this.sent
      .map((raw) => JSON.parse(raw) as { method: string; params: { symbol: string; interval: string } })
      .filter((message) => message.method === "subscribe")
      .map((message) => `${message.params.symbol}_${message.params.interval}`);
  }
}

vi.mock("ws", () => ({
  WebSocket: class {
    static OPEN = 1;
    constructor(url: string) {
      return new FakeSocket(url) as unknown as WebSocket;
    }
  },
}));

const { createWsFeed } = await import("../ws-feed.js");

const silentLogger = { info: () => {}, error: () => {} };

function buildFeed(symbols: string[], intervals: CandleInterval[]) {
  return createWsFeed({
    wsUrl: "wss://test",
    restBaseUrl: "https://test",
    symbols,
    intervals,
    buffer: new CandleBuffer(300),
    logger: silentLogger,
  });
}

describe("createWsFeed subscriptions", () => {
  beforeEach(() => {
    FakeSocket.instances = [];
    // O warm-up dispara fetch REST; aqui só as subscrições importam
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, status: 503 })));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("subscribes to every symbol × interval pair on connect", () => {
    const feed = buildFeed(["BTC", "ETH"], ["15m", "4h"]);
    feed.start();
    FakeSocket.instances[0]!.open();

    expect(FakeSocket.instances[0]!.subscriptions().sort()).toEqual([
      "BTC_15m",
      "BTC_4h",
      "ETH_15m",
      "ETH_4h",
    ]);

    feed.stop();
  });

  it("subscribes only the missing pairs when a new timeframe shows up", () => {
    const feed = buildFeed(["BTC"], ["15m"]);
    feed.start();
    const socket = FakeSocket.instances[0]!;
    socket.open();
    expect(socket.subscriptions()).toEqual(["BTC_15m"]);

    // Estratégia nova em 4h no mesmo símbolo: só o par que falta é assinado
    feed.setSubscriptions(["BTC"], ["15m", "4h"]);
    expect(socket.subscriptions()).toEqual(["BTC_15m", "BTC_4h"]);

    // Símbolo novo entra com TODOS os intervalos correntes
    feed.setSubscriptions(["BTC", "SOL"], ["15m", "4h"]);
    expect(socket.subscriptions().slice(2).sort()).toEqual(["SOL_15m", "SOL_4h"]);

    feed.stop();
  });

  it("resubscribes everything on reconnect (a new socket inherits nothing)", () => {
    vi.useFakeTimers();

    const feed = buildFeed(["BTC"], ["4h"]);
    feed.start();
    const first = FakeSocket.instances[0]!;
    first.open();
    feed.setSubscriptions(["BTC", "ETH"], ["4h"]);
    expect(first.subscriptions()).toEqual(["BTC_4h", "ETH_4h"]);

    first.close(); // queda → reconnect agendado com backoff
    vi.advanceTimersByTime(2_000);

    const second = FakeSocket.instances[1];
    expect(second).toBeDefined();
    second!.open();

    // Conexão nova reassina os DOIS pares, não só o do boot
    expect(second!.subscriptions().sort()).toEqual(["BTC_4h", "ETH_4h"]);

    feed.stop();
    vi.useRealTimers();
  });

  it("holds pairs until the socket opens when it is down", () => {
    const feed = buildFeed([], []);
    feed.start();
    const socket = FakeSocket.instances[0]!;

    // Ainda desconectado: nada é enviado…
    feed.setSubscriptions(["BTC"], ["4h"]);
    expect(socket.subscriptions()).toEqual([]);

    // …mas o par entra assim que a conexão abre
    socket.open();
    expect(socket.subscriptions()).toEqual(["BTC_4h"]);

    feed.stop();
  });
});
