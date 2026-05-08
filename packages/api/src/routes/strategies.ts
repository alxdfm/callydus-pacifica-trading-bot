import { Hono } from "hono";
import type { AppDeps } from "../app.js";
import type { HonoEnv } from "../middleware/auth.js";
import {
  getStrategiesByUserId,
  getStrategyById,
  updateStrategy,
} from "../db/queries/strategies.js";

export function strategiesRoutes(deps: AppDeps): Hono<HonoEnv> {
  const app = new Hono<HonoEnv>();

  // GET /api/strategies
  app.get("/", async (c) => {
    const walletAddress = c.get("walletAddress");
    const strategies = await getStrategiesByUserId(deps.db, walletAddress);
    return c.json({ strategies });
  });

  // POST /api/strategies/:id/activate
  app.post("/:id/activate", async (c) => {
    const walletAddress = c.get("walletAddress");
    const id = c.req.param("id");

    const strategy = await getStrategyById(deps.db, id, walletAddress);

    if (!strategy) {
      return c.json({ status: "error", code: "strategy_not_found", message: "Strategy not found." }, 404);
    }

    const updated = await updateStrategy(deps.db, id, walletAddress, {
      status: "active",
      updatedAt: new Date(),
    });

    return c.json({ status: "success", strategy: updated, message: "Strategy activated." });
  });

  // PUT /api/strategies/:id
  app.put("/:id", async (c) => {
    const walletAddress = c.get("walletAddress");
    const id = c.req.param("id");

    let body: { config?: unknown; symbol?: unknown };
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: "Invalid JSON" }, 400);
    }

    const strategy = await getStrategyById(deps.db, id, walletAddress);

    if (!strategy) {
      return c.json({ status: "error", code: "strategy_not_found", message: "Strategy not found." }, 404);
    }

    const patch: Parameters<typeof updateStrategy>[3] = { updatedAt: new Date() };

    if (body.config !== undefined) {
      patch.config = body.config;
    }

    if (typeof body.symbol === "string" && body.symbol.trim()) {
      patch.symbol = body.symbol.trim();
    }

    const updated = await updateStrategy(deps.db, id, walletAddress, patch);

    return c.json({ status: "success", strategy: updated, message: "Strategy saved." });
  });

  // POST /api/strategies/:id/pause
  app.post("/:id/pause", async (c) => {
    const walletAddress = c.get("walletAddress");
    const id = c.req.param("id");

    const strategy = await getStrategyById(deps.db, id, walletAddress);

    if (!strategy) {
      return c.json({ status: "error", code: "strategy_not_found", message: "Strategy not found." }, 404);
    }

    const updated = await updateStrategy(deps.db, id, walletAddress, {
      status: "paused",
      updatedAt: new Date(),
    });

    return c.json({ status: "success", command: { id, commandType: "pause_bot" }, message: "Bot paused." });
  });

  // POST /api/strategies/:id/resume
  app.post("/:id/resume", async (c) => {
    const walletAddress = c.get("walletAddress");
    const id = c.req.param("id");

    const strategy = await getStrategyById(deps.db, id, walletAddress);

    if (!strategy) {
      return c.json({ status: "error", code: "strategy_not_found", message: "Strategy not found." }, 404);
    }

    const updated = await updateStrategy(deps.db, id, walletAddress, {
      status: "active",
      updatedAt: new Date(),
    });

    return c.json({ status: "success", command: { id, commandType: "resume_bot" }, message: "Bot resumed." });
  });

  return app;
}
