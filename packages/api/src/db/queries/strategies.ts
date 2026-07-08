import { eq, and, ne } from "drizzle-orm";
import type { DrizzleDb } from "../client.js";
import { strategies } from "../schema.js";

export type Strategy = typeof strategies.$inferSelect;
export type NewStrategy = typeof strategies.$inferInsert;

export async function getStrategiesByUserId(
  db: DrizzleDb,
  userId: string,
): Promise<Strategy[]> {
  return db.select().from(strategies).where(eq(strategies.userId, userId));
}

export async function getStrategyById(
  db: DrizzleDb,
  id: string,
  userId: string,
): Promise<Strategy | null> {
  const rows = await db
    .select()
    .from(strategies)
    .where(and(eq(strategies.id, id), eq(strategies.userId, userId)));
  return rows[0] ?? null;
}

export async function createStrategy(
  db: DrizzleDb,
  input: NewStrategy,
): Promise<Strategy> {
  const rows = await db.insert(strategies).values(input).returning();
  const row = rows[0];
  if (!row) throw new Error("Strategy insert returned no rows.");
  return row;
}

export async function insertStrategy(
  db: DrizzleDb,
  userId: string,
  input: { config: unknown; symbol: string },
): Promise<Strategy> {
  const rows = await db
    .insert(strategies)
    .values({ userId, config: input.config, symbol: input.symbol, status: "paused" })
    .returning();
  const row = rows[0];
  if (!row) throw new Error("Strategy insert returned no rows.");
  return row;
}

export async function getActiveStrategyByUserId(
  db: DrizzleDb,
  userId: string,
): Promise<Strategy | null> {
  const rows = await db
    .select()
    .from(strategies)
    .where(and(eq(strategies.userId, userId), ne(strategies.status, "stopped")))
    .limit(1);
  return rows[0] ?? null;
}

export async function updateStrategy(
  db: DrizzleDb,
  id: string,
  userId: string,
  patch: Partial<Pick<Strategy, "config" | "symbol" | "status" | "updatedAt">>,
): Promise<Strategy | null> {
  const rows = await db
    .update(strategies)
    .set(patch)
    .where(and(eq(strategies.id, id), eq(strategies.userId, userId)))
    .returning();
  return rows[0] ?? null;
}
