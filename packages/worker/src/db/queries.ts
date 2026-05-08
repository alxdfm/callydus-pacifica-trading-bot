import { eq } from "drizzle-orm";
import type { DrizzleDb } from "./client.js";
import { strategies, trades, events } from "./schema.js";

// ---------------------------------------------------------------------------
// Inferred types from schema
// ---------------------------------------------------------------------------

export type Strategy = typeof strategies.$inferSelect;
export type Trade = typeof trades.$inferSelect;
export type Event = typeof events.$inferSelect;

export type InsertTrade = typeof trades.$inferInsert;
export type InsertEvent = typeof events.$inferInsert;

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export async function getActiveStrategies(db: DrizzleDb): Promise<Strategy[]> {
  return db
    .select()
    .from(strategies)
    .where(eq(strategies.status, "active"));
}

export async function insertTrade(
  db: DrizzleDb,
  trade: InsertTrade,
): Promise<void> {
  await db.insert(trades).values(trade);
}

export async function updateTrade(
  db: DrizzleDb,
  id: string,
  update: Partial<InsertTrade>,
): Promise<void> {
  await db.update(trades).set(update).where(eq(trades.id, id));
}

export async function getOpenTradesForStrategy(
  db: DrizzleDb,
  strategyId: string,
): Promise<Trade[]> {
  return db
    .select()
    .from(trades)
    .where(eq(trades.strategyId, strategyId));
}

export async function insertEvent(
  db: DrizzleDb,
  event: InsertEvent,
): Promise<void> {
  await db.insert(events).values(event);
}
