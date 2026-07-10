import { Hono } from "hono";
import type { DrizzleDb } from "./db/client.js";
import type { ApiEnv } from "./config/env.js";
import { createCorsMiddleware } from "./middleware/cors.js";
import { createAuthMiddleware } from "./middleware/auth.js";
import { createRateLimitMiddleware } from "./middleware/rate-limit.js";
import { authRoutes } from "./routes/auth.js";
import { onboardingRoutes } from "./routes/onboarding.js";
import { v2Routes } from "./routes/v2.js";

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
  app.use("/api/v2/*", createAuthMiddleware(deps));

  app.route("/api/auth", authRoutes(deps));
  app.route("/api/onboarding", onboardingRoutes(deps));
  app.route("/api/v2", v2Routes(deps));

  return app;
}
