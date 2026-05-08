import { Hono } from "hono";
import type { AppDeps } from "../app.js";
import type { HonoEnv } from "../middleware/auth.js";
import { getEventsByUserId } from "../db/queries/events.js";

export function eventsRoutes(deps: AppDeps): Hono<HonoEnv> {
  const app = new Hono<HonoEnv>();

  // GET /api/events
  app.get("/", async (c) => {
    const walletAddress = c.get("walletAddress");
    const eventList = await getEventsByUserId(deps.db, walletAddress);
    return c.json({ events: eventList });
  });

  return app;
}
