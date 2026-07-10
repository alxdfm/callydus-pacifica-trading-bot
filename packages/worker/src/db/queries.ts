import { and, eq, ne } from "drizzle-orm";
import type { DrizzleDb } from "./client.js";
import { accounts, credentials, strategies, trades, events } from "./schema.js";

// ---------------------------------------------------------------------------
// Inferred types from schema
// ---------------------------------------------------------------------------

export type Strategy = typeof strategies.$inferSelect;
export type Trade = typeof trades.$inferSelect;
export type Event = typeof events.$inferSelect;
export type Credential = typeof credentials.$inferSelect;

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
    .where(
      and(eq(trades.strategyId, strategyId), ne(trades.status, "closed")),
    );
}

export async function getActiveCredentialForWallet(
  db: DrizzleDb,
  walletAddress: string,
): Promise<Credential | null> {
  const rows = await db
    .select({ credential: credentials })
    .from(credentials)
    .innerJoin(accounts, eq(credentials.accountId, accounts.id))
    .where(
      and(
        eq(accounts.walletAddress, walletAddress),
        eq(credentials.validationStatus, "valid"),
        eq(credentials.lifecycleStatus, "active"),
      ),
    )
    .limit(1);
  return rows[0]?.credential ?? null;
}

export async function insertEvent(
  db: DrizzleDb,
  event: InsertEvent,
): Promise<void> {
  await db.insert(events).values(event);
}
