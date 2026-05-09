import { handle } from "hono/aws-lambda";
import { createApp } from "./app.js";
import { loadApiEnv } from "./config/env.js";
import { createDrizzleClient } from "./db/client.js";

const env = loadApiEnv();
const db = createDrizzleClient(env.DATABASE_URL);
const app = createApp({ db, env });

export const handler = handle(app);

if (process.env["NODE_ENV"] !== "production") {
  const { serve } = await import("@hono/node-server");
  serve({ fetch: app.fetch, port: env.PORT });
}
