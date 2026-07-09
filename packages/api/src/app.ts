import { Hono } from "hono";
import type { DrizzleDb } from "./db/client.js";
import type { ApiEnv } from "./config/env.js";
import { createCorsMiddleware } from "./middleware/cors.js";
import { createAuthMiddleware } from "./middleware/auth.js";
import { createRateLimitMiddleware } from "./middleware/rate-limit.js";
import { strategiesRoutes } from "./routes/strategies.js";
import { tradesRoutes } from "./routes/trades.js";
import { authRoutes } from "./routes/auth.js";
import { onboardingRoutes } from "./routes/onboarding.js";
import { accountRoutes } from "./routes/account.js";
import { runtimeRoutes } from "./routes/runtime.js";

export type AppDeps = {
  db: DrizzleDb;
  env: ApiEnv;
};

export function createApp(deps: AppDeps): Hono {
  const app = new Hono();

  app.get("/health", (c) => c.json({ status: "ok" }));

  app.use("*", createCorsMiddleware(deps.env.APP_ORIGIN));
  app.use(
    "/api/auth/*",
    createRateLimitMiddleware({ windowMs: 60_000, max: 30 }),
  );
  app.use("/api/strategies/*", createAuthMiddleware(deps));
  app.use("/api/trades/*", createAuthMiddleware(deps));
  app.use("/api/account/*", createAuthMiddleware(deps));
  app.use("/api/runtime/*", createAuthMiddleware(deps));

  app.route("/api/strategies", strategiesRoutes(deps));
  app.route("/api/trades", tradesRoutes(deps));
  app.route("/api/auth", authRoutes(deps));
  app.route("/api/onboarding", onboardingRoutes(deps));
  app.route("/api/account", accountRoutes(deps));
  app.route("/api/runtime", runtimeRoutes(deps));

  return app;
}
