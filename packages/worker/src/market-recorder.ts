import type { DrizzleDb } from "./db/client.js";
import { marketSnapshots } from "./db/schema.js";

// ---------------------------------------------------------------------------
// Gravador do canal `prices` do WS (funding, open interest, mark/oracle/mid).
//
// POR QUE ISTO EXISTE: a Pacifica não guarda histórico nenhum desses dados
// (probado em 2026-07-14 — /api/v1/trades devolve ~2 minutos e ignora
// paginação, /api/v1/info só o valor corrente, e não existe stream de
// liquidação). Sem histórico não há backtest, e sem backtest o builder não pode
// oferecer o indicador — é essa a regra que descarta heatmap de liquidação e
// profundidade de book. Funding e OI são a ÚNICA fonte de sinal disponível que
// não é uma transformação do OHLCV, então a única saída é começar a gravar: em
// alguns meses existe série própria contra a qual testar.
//
// Nada aqui está no caminho crítico do bot. Uma falha de escrita é logada e
// esquecida — o recorder jamais pode derrubar a execução de ordens.
// ---------------------------------------------------------------------------

/** Snapshot cru do canal `prices` (uma entrada por símbolo, todos os símbolos). */
export type MarketSnapshot = {
  symbol: string;
  funding: number | null;
  nextFunding: number | null;
  openInterest: number | null;
  oracle: number | null;
  mark: number | null;
  mid: number | null;
  volume24h: number | null;
  timestamp: number;
};

type MarketRecorderLogger = {
  info: (...a: unknown[]) => void;
  error: (...a: unknown[]) => void;
};

type MarketRecorderInput = {
  db: DrizzleDb;
  /** Símbolos a gravar. Ver RECORDED_SYMBOLS no index — é o universo negociável. */
  symbols: string[];
  logger?: MarketRecorderLogger;
};

// O canal emite a cada poucos segundos; gravar tudo seriam ~29k linhas/dia por
// símbolo. Um ponto por minuto é resolução de sobra para sinal de funding/OI
// (o funding em si muda de hora em hora) e mantém a tabela em ~1.6M linhas/ano.
const BUCKET_MS = 60_000;

export function createMarketRecorder(input: MarketRecorderInput): {
  onSnapshots(snapshots: MarketSnapshot[]): void;
} {
  const logger = input.logger ?? {
    info: (...a: unknown[]) => console.info(...a),
    error: (...a: unknown[]) => console.error(...a),
  };
  const wanted = new Set(input.symbols);
  // Último minuto já gravado por símbolo — evita ida ao banco a cada mensagem
  const lastBucketBySymbol = new Map<string, number>();

  return {
    onSnapshots(snapshots: MarketSnapshot[]) {
      const rows: (typeof marketSnapshots.$inferInsert)[] = [];

      for (const snapshot of snapshots) {
        if (!wanted.has(snapshot.symbol)) continue;
        if (!Number.isFinite(snapshot.timestamp)) continue;

        const bucket = Math.floor(snapshot.timestamp / BUCKET_MS) * BUCKET_MS;
        if (lastBucketBySymbol.get(snapshot.symbol) === bucket) continue;
        lastBucketBySymbol.set(snapshot.symbol, bucket);

        rows.push({
          symbol: snapshot.symbol,
          fundingRate: snapshot.funding?.toString() ?? null,
          nextFundingRate: snapshot.nextFunding?.toString() ?? null,
          openInterest: snapshot.openInterest?.toString() ?? null,
          oraclePrice: snapshot.oracle?.toString() ?? null,
          markPrice: snapshot.mark?.toString() ?? null,
          midPrice: snapshot.mid?.toString() ?? null,
          volume24h: snapshot.volume24h?.toString() ?? null,
          recordedAt: new Date(bucket),
        });
      }

      if (rows.length === 0) return;

      // Fire-and-forget: gravar mercado nunca pode bloquear nem derrubar o bot.
      // onConflictDoNothing torna a escrita idempotente contra o índice único
      // (symbol, recorded_at) — restart no meio do minuto não duplica linha.
      void input.db
        .insert(marketSnapshots)
        .values(rows)
        .onConflictDoNothing()
        .catch((err: unknown) => {
          logger.error("[market-recorder] snapshot insert failed", err);
        });
    },
  };
}
