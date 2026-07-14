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

// ---------------------------------------------------------------------------
// Canal `prices` + market-recorder: funding e open interest são o único sinal
// disponível que NÃO é transformação do OHLCV, e a Pacifica não guarda
// histórico deles. Se o recorder falha em silêncio, a série nasce furada e só
// se descobre meses depois — quando já não dá para recuperar o passado.
// ---------------------------------------------------------------------------

const { createMarketRecorder } = await import("../market-recorder.js");

function pricesMessage(rows: Record<string, unknown>[]) {
  return JSON.stringify({ channel: "prices", data: rows });
}

describe("createWsFeed prices channel", () => {
  beforeEach(() => {
    FakeSocket.instances = [];
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, status: 503 })));
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("subscribes to prices globally — one subscribe, no symbol", () => {
    const feed = createWsFeed({
      wsUrl: "wss://test",
      restBaseUrl: "https://test",
      symbols: ["BTC", "ETH"],
      intervals: ["4h"],
      buffer: new CandleBuffer(300),
      logger: silentLogger,
      onPrices: () => {},
    });
    feed.start();
    FakeSocket.instances[0]!.open();

    const prices = FakeSocket.instances[0]!.sent
      .map((raw) => JSON.parse(raw) as { params: { source: string; symbol?: string } })
      .filter((m) => m.params.source === "prices");

    // O canal devolve os 69 símbolos da exchange de uma vez: assinar por símbolo
    // multiplicaria a mesma mensagem por N
    expect(prices).toHaveLength(1);
    expect(prices[0]!.params.symbol).toBeUndefined();

    feed.stop();
  });

  it("does not subscribe to prices when no recorder is attached", () => {
    const feed = buildFeed(["BTC"], ["4h"]);
    feed.start();
    FakeSocket.instances[0]!.open();

    const sources = FakeSocket.instances[0]!.sent.map(
      (raw) => (JSON.parse(raw) as { params: { source: string } }).params.source,
    );
    expect(sources).not.toContain("prices");

    feed.stop();
  });

  it("parses a prices payload, keeping absent fields null instead of zero", () => {
    const received: unknown[] = [];
    const feed = createWsFeed({
      wsUrl: "wss://test",
      restBaseUrl: "https://test",
      symbols: ["BTC"],
      intervals: ["4h"],
      buffer: new CandleBuffer(300),
      logger: silentLogger,
      onPrices: (snapshots) => received.push(...snapshots),
    });
    feed.start();
    const socket = FakeSocket.instances[0]!;
    socket.open();

    socket.emit(
      "message",
      pricesMessage([
        {
          symbol: "BTC",
          funding: "-0.00000833",
          next_funding: "-0.00000227",
          oracle: "62939.47",
          mark: "62910.49",
          mid: "62887.5",
          open_interest: "508.46",
          volume_24h: "498491111.8",
          timestamp: 1_784_031_648_256,
        },
        // sem open_interest: null é obrigatório — 0 seria lido como "sem posições
        // em aberto", que é uma afirmação de mercado, não um dado faltando
        { symbol: "ETH", funding: "0.00001", timestamp: 1_784_031_648_256 },
      ]),
    );

    expect(received).toHaveLength(2);
    expect(received[0]).toMatchObject({
      symbol: "BTC",
      funding: -0.00000833,
      openInterest: 508.46,
      mark: 62910.49,
    });
    expect(received[1]).toMatchObject({ symbol: "ETH", openInterest: null, mark: null });

    feed.stop();
  });
});

describe("createMarketRecorder", () => {
  function fakeDb() {
    const inserted: Record<string, unknown>[][] = [];
    const db = {
      insert: () => ({
        values: (rows: Record<string, unknown>[]) => {
          inserted.push(rows);
          return { onConflictDoNothing: () => Promise.resolve() };
        },
      }),
    };
    return { db: db as never, inserted };
  }

  const snapshot = (symbol: string, timestamp: number) => ({
    symbol,
    funding: 0.0001,
    nextFunding: 0.0002,
    openInterest: 500,
    oracle: 60_000,
    mark: 60_001,
    mid: 60_002,
    volume24h: 1_000_000,
    timestamp,
  });

  it("records one row per symbol per minute and drops the rest", () => {
    const { db, inserted } = fakeDb();
    const recorder = createMarketRecorder({ db, symbols: ["BTC"], logger: silentLogger });

    const minute = 1_784_031_600_000; // múltiplo de 60s
    recorder.onSnapshots([snapshot("BTC", minute)]);
    recorder.onSnapshots([snapshot("BTC", minute + 5_000)]); // mesmo minuto → ignorado
    recorder.onSnapshots([snapshot("BTC", minute + 59_999)]); // ainda o mesmo
    recorder.onSnapshots([snapshot("BTC", minute + 60_000)]); // minuto seguinte

    expect(inserted).toHaveLength(2);
    expect(inserted[0]![0]!.recordedAt).toEqual(new Date(minute));
    expect(inserted[1]![0]!.recordedAt).toEqual(new Date(minute + 60_000));
  });

  it("ignores symbols outside the recorded universe", () => {
    const { db, inserted } = fakeDb();
    const recorder = createMarketRecorder({ db, symbols: ["BTC", "SOL"], logger: silentLogger });

    // O canal é global: chegam os 69 símbolos da exchange, não só os nossos
    recorder.onSnapshots([
      snapshot("BTC", 1_784_031_600_000),
      snapshot("PUMP", 1_784_031_600_000),
      snapshot("SOL", 1_784_031_600_000),
    ]);

    expect(inserted).toHaveLength(1);
    expect(inserted[0]!.map((r) => r.symbol)).toEqual(["BTC", "SOL"]);
  });

  it("never lets a failed write escape into the bot", async () => {
    const db = {
      insert: () => ({
        values: () => ({ onConflictDoNothing: () => Promise.reject(new Error("db down")) }),
      }),
    } as never;
    const errors: unknown[][] = [];
    const recorder = createMarketRecorder({
      db,
      symbols: ["BTC"],
      logger: { info: () => {}, error: (...a) => errors.push(a) },
    });

    // Gravar mercado é acessório: se o banco cai, o bot segue executando ordens
    expect(() => recorder.onSnapshots([snapshot("BTC", 1_784_031_600_000)])).not.toThrow();
    await new Promise((r) => setTimeout(r, 0));
    expect(errors).toHaveLength(1);
  });
});
