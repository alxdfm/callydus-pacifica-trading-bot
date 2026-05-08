import { eq } from "drizzle-orm";
import type { DrizzleDb } from "../client.js";
import { trades, strategies } from "../schema.js";

export type Trade = typeof trades.$inferSelect;
export type NewTrade = typeof trades.$inferInsert;

export async function getTradesByStrategyId(
  db: DrizzleDb,
  strategyId: string,
): Promise<Trade[]> {
  return db.select().from(trades).where(eq(trades.strategyId, strategyId));
}

export async function getTradesByUserId(
  db: DrizzleDb,
  userId: string,
): Promise<Trade[]> {
  return db
    .select({ trade: trades })
    .from(trades)
    .innerJoin(strategies, eq(trades.strategyId, strategies.id))
    .where(eq(strategies.userId, userId))
    .then((rows) => rows.map((r) => r.trade));
}

export async function insertTrade(
  db: DrizzleDb,
  input: NewTrade,
): Promise<Trade> {
  const rows = await db.insert(trades).values(input).returning();
  const row = rows[0];
  if (!row) throw new Error("Trade insert returned no rows.");
  return row;
}

export async function updateTrade(
  db: DrizzleDb,
  id: string,
  patch: Partial<
    Pick<
      Trade,
      | "exitPrice"
      | "sl"
      | "tp"
      | "status"
      | "closeReason"
      | "realizedPnl"
      | "pacificaOrderId"
      | "closedAt"
    >
  >,
): Promise<Trade | null> {
  const rows = await db
    .update(trades)
    .set(patch)
    .where(eq(trades.id, id))
    .returning();
  return rows[0] ?? null;
}
