import type { CandleInterval } from "@pacifica/shared";
import { loadWorkerEnv } from "./config/env.js";
import { CandleBuffer } from "./candle-buffer.js";
import { createDrizzleClient } from "./db/client.js";
import { fetchCandles } from "./candle-fetch.js";
import { PacificaClient } from "./exchange/pacifica/client.js";
import { PacificaAdapter } from "./exchange/pacifica/adapter.js";
import { createBot } from "./bot.js";
import { getIntervalDurationMs } from "./engine/evaluator.js";
import { recordHourlySnapshots } from "./market-snapshot.js";
import { getActiveStrategies } from "./db/queries.js";

// ---------------------------------------------------------------------------
// Entry do worker agendado (sst.aws.Cron, horário no minuto :01 UTC).
//
// Cada invocação é um mundo novo: carrega as estratégias ativas, reconstrói o
// buffer de candles via REST e roda UM tick do bot (reconcile + avaliação).
// Não há WS nem processo residente — o bot só avalia candle fechado, e candle
// de 1h/4h só fecha de hora em hora, então presença contínua era desperdício.
// SL/TP vivem na exchange (submetidos com a ordem): o bot ficar fora do ar
// entre invocações não desprotege posição nenhuma.
// ---------------------------------------------------------------------------

// Warm-up igual ao do ws-feed antigo: 300 velas cobrem com folga o maior
// requiredPeriod dos indicadores (EMA 90 converge em ~3x o período)
const WARMUP_CANDLE_COUNT = 300;

// Universo negociável (`marketSymbolSchema`). O snapshot grava estes símbolos
// SEMPRE, independentemente de haver estratégia ativa neles: a série só vale se
// for contínua, e depender das estratégias abriria buracos exatamente nos
// períodos sem bot rodando.
const RECORDED_SYMBOLS = ["BTC", "ETH", "SOL"];

/** Pares (símbolo, timeframe) exatos das estratégias ativas — sem cross-product. */
export function resolveCandlePairs(strategies: { config: unknown }[]): {
  symbol: string;
  interval: CandleInterval;
}[] {
  const seen = new Set<string>();
  const pairs: { symbol: string; interval: CandleInterval }[] = [];

  for (const strategy of strategies) {
    const config = strategy.config as { symbol?: string; timeframe?: string };
    const symbol = config.symbol?.match(/^([A-Z]+)\/USDC$/)?.[1];
    const interval = config.timeframe as CandleInterval | undefined;

    if (!symbol || !interval) continue;

    const key = `${symbol}_${interval}`;
    if (seen.has(key)) continue;
    seen.add(key);
    pairs.push({ symbol, interval });
  }

  return pairs;
}

export async function handler(): Promise<{
  strategies: number;
  pairs: number;
}> {
  const env = loadWorkerEnv();
  const db = createDrizzleClient(env.DATABASE_URL);

  try {
    const strategies = await getActiveStrategies(db);
    const pairs = resolveCandlePairs(strategies);

    console.info("[handler] tick starting", {
      strategies: strategies.length,
      pairs: pairs.map((p) => `${p.symbol}_${p.interval}`),
    });

    const buffer = new CandleBuffer(WARMUP_CANDLE_COUNT);

    for (const { symbol, interval } of pairs) {
      const candles = await fetchCandles({
        restBaseUrl: env.PACIFICA_REST_URL,
        symbol,
        interval,
        intervalMs: getIntervalDurationMs(interval),
        count: WARMUP_CANDLE_COUNT,
      });

      for (const candle of candles) {
        buffer.push(symbol, interval, candle);
      }
    }

    // O bot cria os próprios clients assinados por estratégia (credenciais do
    // banco). Este client raiz só serve endpoints não autenticados (market
    // info); os campos de assinatura são placeholders nunca usados.
    const pacificaClient = new PacificaClient({
      apiBaseUrl: env.PACIFICA_REST_URL,
      account: "11111111111111111111111111111111",
      privateKey: "11111111111111111111111111111111",
      agentWallet: "11111111111111111111111111111111",
      builderCode: env.PACIFICA_BUILDER_CODE,
      expiryWindowMs: env.PACIFICA_SIGNATURE_EXPIRY_WINDOW_MS,
    });
    const adapter = new PacificaAdapter(pacificaClient);

    const bot = createBot({
      db,
      exchange: adapter,
      candleBuffer: buffer,
      env,
    });

    bot.onStrategiesChanged(strategies);
    await bot.runOnce();

    // Depois do tick para nunca competir com a execução de ordens
    await recordHourlySnapshots({
      db,
      restBaseUrl: env.PACIFICA_REST_URL,
      symbols: RECORDED_SYMBOLS,
    });

    console.info("[handler] tick finished", {
      strategies: strategies.length,
    });

    return { strategies: strategies.length, pairs: pairs.length };
  } finally {
    // Lambda congela o processo entre invocações: conexão pendurada não é
    // confiável na invocação seguinte e atrasa o autosuspend do Neon
    await db.$client.end({ timeout: 5 });
  }
}
