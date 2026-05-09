import { desc, eq } from "drizzle-orm";
import type { DrizzleDb } from "../client.js";
import { events, strategies } from "../schema.js";

export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;

export async function getEventsByUserId(
  db: DrizzleDb,
  userId: string,
): Promise<Event[]> {
  return db
    .select({ event: events })
    .from(events)
    .innerJoin(strategies, eq(events.strategyId, strategies.id))
    .where(eq(strategies.userId, userId))
    .then((rows) => rows.map((r) => r.event));
}

export async function insertEvent(
  db: DrizzleDb,
  input: NewEvent,
): Promise<Event> {
  const rows = await db.insert(events).values(input).returning();
  const row = rows[0];
  if (!row) throw new Error("Event insert returned no rows.");
  return row;
}

export async function getEventsByStrategyId(
  db: DrizzleDb,
  strategyId: string,
  limit = 20,
): Promise<Event[]> {
  return db
    .select()
    .from(events)
    .where(eq(events.strategyId, strategyId))
    .orderBy(desc(events.createdAt))
    .limit(limit);
}
