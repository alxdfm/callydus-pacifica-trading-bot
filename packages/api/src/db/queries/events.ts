import { desc, eq } from "drizzle-orm";
import type { DrizzleDb } from "../client.js";
import { events } from "../schema.js";

export type Event = typeof events.$inferSelect;

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
