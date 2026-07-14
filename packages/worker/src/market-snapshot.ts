import type { DrizzleDb } from "./db/client.js";
import { marketSnapshots } from "./db/schema.js";

// ---------------------------------------------------------------------------
// Snapshot horário de funding/OI/mark via REST (/api/v1/info).
//
// Substitui o market-recorder do WS (1 linha/minuto): com o worker agendado de
// hora em hora, a resolução cai para 1 linha/hora — que é a resolução real do
// funding (ele muda de hora em hora; o que se perde é a dinâmica intra-hora do
// open interest, trade-off aceito em 2026-07-14). A motivação de gravar segue a
// mesma: a Pacifica não guarda histórico nenhum desses dados, então sem série
// própria não há backtest de funding/OI.
//
// Nada aqui está no caminho crítico do bot: falha é logada e engolida. Mas o
// insert é AGUARDADO — em Lambda uma promise solta congela com o container e a
// escrita se perde.
// ---------------------------------------------------------------------------

type SnapshotLogger = {
  info: (...a: unknown[]) => void;
  error: (...a: unknown[]) => void;
};

const defaultLogger: SnapshotLogger = {
  info: (...a) => console.info(...a),
  error: (...a) => console.error(...a),
};

const HOUR_MS = 3_600_000;

/** `null` quando o campo vem ausente ou impossível de parsear — nunca 0. */
function toNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

type SnapshotRow = typeof marketSnapshots.$inferInsert;

/**
 * Extrai as linhas de snapshot do payload do /api/v1/info. Aceita array ou
 * objeto keyado por símbolo, e os nomes de campo do REST (snake_case) com
 * fallback para os do canal `prices` do WS.
 */
export function parseMarketInfoSnapshots(
  payload: unknown,
  wantedSymbols: string[],
  recordedAt: Date,
): SnapshotRow[] {
  const data =
    payload && typeof payload === "object" && "data" in payload
      ? (payload as { data?: unknown }).data
      : payload;

  const source = Array.isArray(data)
    ? data
    : data && typeof data === "object"
      ? Object.entries(data as Record<string, unknown>).map(([key, value]) => ({
          symbol: key,
          ...(value as Record<string, unknown>),
        }))
      : [];

  const wanted = new Set(wantedSymbols);
  const rows: SnapshotRow[] = [];

  for (const item of source) {
    if (!item || typeof item !== "object") continue;

    const row = item as Record<string, unknown>;
    const symbol = String(row.symbol ?? row.name ?? "").trim();
    if (!wanted.has(symbol)) continue;

    const values = {
      fundingRate: toNumberOrNull(row.funding_rate ?? row.funding),
      nextFundingRate: toNumberOrNull(row.next_funding_rate ?? row.next_funding),
      openInterest: toNumberOrNull(row.open_interest),
      oraclePrice: toNumberOrNull(row.oracle_price ?? row.oracle),
      markPrice: toNumberOrNull(row.mark_price ?? row.mark),
      midPrice: toNumberOrNull(row.mid_price ?? row.mid),
      volume24h: toNumberOrNull(row.volume_24h),
    };

    // Linha 100% nula é ruído, não série — sinal de que o shape do endpoint
    // mudou e o parse não achou campo nenhum
    if (Object.values(values).every((v) => v === null)) continue;

    rows.push({
      symbol,
      fundingRate: values.fundingRate?.toString() ?? null,
      nextFundingRate: values.nextFundingRate?.toString() ?? null,
      openInterest: values.openInterest?.toString() ?? null,
      oraclePrice: values.oraclePrice?.toString() ?? null,
      markPrice: values.markPrice?.toString() ?? null,
      midPrice: values.midPrice?.toString() ?? null,
      volume24h: values.volume24h?.toString() ?? null,
      recordedAt,
    });
  }

  return rows;
}

/** Grava um snapshot por símbolo no bucket da hora corrente. Idempotente. */
export async function recordHourlySnapshots(input: {
  db: DrizzleDb;
  restBaseUrl: string;
  symbols: string[];
  now?: number;
  logger?: SnapshotLogger;
}): Promise<void> {
  const logger = input.logger ?? defaultLogger;
  const restBaseUrl = input.restBaseUrl.replace(/\/+$/, "");
  const nowMs = input.now ?? Date.now();
  const recordedAt = new Date(Math.floor(nowMs / HOUR_MS) * HOUR_MS);

  try {
    const response = await fetch(`${restBaseUrl}/api/v1/info`, {
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      logger.error("[market-snapshot] info request failed", {
        status: response.status,
      });
      return;
    }

    const payload = (await response.json()) as unknown;
    const rows = parseMarketInfoSnapshots(payload, input.symbols, recordedAt);

    if (rows.length === 0) {
      logger.error("[market-snapshot] no snapshot fields parsed from /api/v1/info", {
        symbols: input.symbols,
      });
      return;
    }

    // onConflictDoNothing contra o índice único (symbol, recorded_at):
    // reexecução dentro da mesma hora não duplica linha
    await input.db.insert(marketSnapshots).values(rows).onConflictDoNothing();

    logger.info("[market-snapshot] recorded", {
      symbols: rows.map((r) => r.symbol),
      recordedAt: recordedAt.toISOString(),
    });
  } catch (err) {
    logger.error("[market-snapshot] snapshot failed", err);
  }
}
