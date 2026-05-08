import { Hono } from "hono";
import type { AppDeps } from "../app.js";
import type { HonoEnv } from "../middleware/auth.js";
import { getTradesByUserId, updateTrade } from "../db/queries/trades.js";
import { getStrategyById } from "../db/queries/strategies.js";

export function tradesRoutes(deps: AppDeps): Hono<HonoEnv> {
  const app = new Hono<HonoEnv>();

  // GET /api/trades
  app.get("/", async (c) => {
    const walletAddress = c.get("walletAddress");
    const trades = await getTradesByUserId(deps.db, walletAddress);
    return c.json({ trades });
  });

  // POST /api/trades/:id/close
  app.post("/:id/close", async (c) => {
    const walletAddress = c.get("walletAddress");
    const id = c.req.param("id");

    // Verify the trade belongs to this user (via strategy)
    const userTrades = await getTradesByUserId(deps.db, walletAddress);
    const trade = userTrades.find((t) => t.id === id);

    if (!trade) {
      return c.json(
        { status: "error", code: "trade_not_found", message: "Trade not found." },
        404,
      );
    }

    await updateTrade(deps.db, id, { status: "close_requested" });

    return c.json({
      status: "success",
      command: {
        id: crypto.randomUUID(),
        commandType: "close_trade",
        commandStatus: "completed",
        targetType: "trade",
        targetId: id,
        requestedAt: new Date().toISOString(),
        finishedAt: new Date().toISOString(),
        failureReason: null,
      },
      message: "Trade close requested successfully.",
    });
  });

  return app;
}
