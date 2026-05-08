import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.js";

export type DrizzleDb = ReturnType<typeof createDrizzleClient>;

export function createDrizzleClient(databaseUrl: string) {
  const sql = postgres(databaseUrl);
  return drizzle(sql, { schema });
}
