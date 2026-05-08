import { loadWorkerEnv } from "./config/env.js";
import { CandleBuffer } from "./candle-buffer.js";
import { createDrizzleClient } from "./db/client.js";
import { createWsFeed } from "./ws-feed.js";
import { PacificaClient } from "./exchange/pacifica/client.js";
import { PacificaAdapter } from "./exchange/pacifica/adapter.js";
import { createBot } from "./bot.js";
import { createDbWatcher } from "./db-watcher.js";
import { getActiveStrategies } from "./db/queries.js";

const env = loadWorkerEnv();
const db = createDrizzleClient(env.DATABASE_URL);
const buffer = new CandleBuffer(300);

// Resolve initial symbols/intervals from DB before starting the feed
const initialStrategies = await getActiveStrategies(db);

const symbols = [
  ...new Set(
    initialStrategies.flatMap((s) => {
      const config = s.config as { symbol?: string };
      const sym = config.symbol;
      if (!sym) return [];
      const match = sym.match(/^([A-Z]+)\/USDC$/);
      return match?.[1] ? [match[1]] : [];
    }),
  ),
];

const intervals = ["1m", "5m", "15m", "1h", "4h"] as const;

const pacificaClient = new PacificaClient({
  apiBaseUrl: env.PACIFICA_REST_URL,
  // The bot creates its own signed clients per-strategy using stored credentials.
  // This root client is only used for unauthenticated endpoints (market info, candles).
  // We pass placeholder signing fields that will not be used for signed requests.
  account: "11111111111111111111111111111111",
  privateKey: "11111111111111111111111111111111",
  agentWallet: "11111111111111111111111111111111",
  builderCode: env.PACIFICA_BUILDER_CODE,
  expiryWindowMs: env.PACIFICA_SIGNATURE_EXPIRY_WINDOW_MS,
});

const adapter = new PacificaAdapter(pacificaClient);

const wsFeed = createWsFeed({
  wsUrl: env.PACIFICA_WS_URL,
  restBaseUrl: env.PACIFICA_REST_URL,
  symbols: [...symbols],
  intervals: [...intervals],
  buffer,
});

const bot = createBot({
  db,
  exchange: adapter,
  candleBuffer: buffer,
  env,
});

const dbWatcher = createDbWatcher({
  db,
  pollIntervalMs: 30_000,
  onStrategiesChanged: (strategies) => {
    // Forward new strategies to the bot
    (bot as unknown as { onStrategiesChanged?: (s: typeof strategies) => void })
      .onStrategiesChanged?.(strategies);
  },
});

wsFeed.start();
dbWatcher.start();
await bot.start();

process.on("SIGTERM", async () => {
  await bot.stop();
  dbWatcher.stop();
  wsFeed.stop();
  process.exit(0);
});

process.on("SIGINT", async () => {
  await bot.stop();
  dbWatcher.stop();
  wsFeed.stop();
  process.exit(0);
});
