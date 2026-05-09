import { Hono } from "hono";
import type { DrizzleDb } from "./db/client.js";
import type { ApiEnv } from "./config/env.js";
import { createCorsMiddleware } from "./middleware/cors.js";
import { createAuthMiddleware } from "./middleware/auth.js";
import { strategiesRoutes } from "./routes/strategies.js";
import { tradesRoutes } from "./routes/trades.js";
import { eventsRoutes } from "./routes/events.js";
import { builderRoutes } from "./routes/builder.js";
import { authRoutes } from "./routes/auth.js";
import { backtestRoutes } from "./routes/backtest.js";
import { positionsRoutes } from "./routes/positions.js";
import { onboardingRoutes } from "./routes/onboarding.js";
import { accountRoutes } from "./routes/account.js";
import { runtimeRoutes } from "./routes/runtime.js";

export type AppDeps = {
  db: DrizzleDb;
  env: ApiEnv;
};

export function createApp(deps: AppDeps): Hono {
  const app = new Hono();

  app.use("*", createCorsMiddleware(deps.env.APP_ORIGIN));
  app.use("/api/strategies/*", createAuthMiddleware(deps));
  app.use("/api/trades/*", createAuthMiddleware(deps));
  app.use("/api/events/*", createAuthMiddleware(deps));
  app.use("/api/positions/*", createAuthMiddleware(deps));
  app.use("/api/account/*", createAuthMiddleware(deps));
  app.use("/api/runtime/*", createAuthMiddleware(deps));

  app.route("/api/strategies", strategiesRoutes(deps));
  app.route("/api/trades", tradesRoutes(deps));
  app.route("/api/events", eventsRoutes(deps));
  app.route("/api/builder", builderRoutes(deps));
  app.route("/api/auth", authRoutes(deps));
  app.route("/api/backtest", backtestRoutes(deps));
  app.route("/api/positions", positionsRoutes(deps));
  app.route("/api/onboarding", onboardingRoutes(deps));
  app.route("/api/account", accountRoutes(deps));
  app.route("/api/runtime", runtimeRoutes(deps));

  return app;
}
