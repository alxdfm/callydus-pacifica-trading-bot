import { Hono } from "hono";
import { randomUUID } from "node:crypto";
import type { AppDeps } from "../app.js";
import type { HonoEnv } from "../middleware/auth.js";
import { getActiveStrategyByUserId, updateStrategy, type Strategy } from "../db/queries/strategies.js";

function deriveStrategyBotStatus(strategy: Strategy | null): "active" | "paused" | "inactive" {
  if (strategy === null) return "inactive";
  if (strategy.status === "active") return "active";
  if (strategy.status === "paused") return "paused";
  return "inactive";
}

export function runtimeRoutes(deps: AppDeps): Hono<HonoEnv> {
  const app = new Hono<HonoEnv>();

  // POST /api/runtime/pause
  app.post("/pause", async (c) => {
    const walletAddress = c.get("walletAddress");

    try {
      const strategy = await getActiveStrategyByUserId(deps.db, walletAddress);

      if (!strategy) {
        return c.json(
          {
            status: "error",
            code: "account_not_ready",
            message: "No active strategy found.",
            retryable: false,
          },
          404,
        );
      }

      await updateStrategy(deps.db, strategy.id, walletAddress, {
        status: "paused",
        updatedAt: new Date(),
      });

      const now = new Date().toISOString();

      return c.json({
        status: "success",
        command: {
          id: randomUUID(),
          commandType: "pause_bot",
          commandStatus: "completed",
          targetType: "bot",
          targetId: strategy.id,
          requestedAt: now,
          finishedAt: now,
          failureReason: null,
        },
        message: "Bot paused.",
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error("[runtime/pause]", message);
      return c.json(
        {
          status: "error",
          code: "internal_error",
          message: "Failed to pause bot. Try again.",
          retryable: true,
        },
        500,
      );
    }
  });

  // POST /api/runtime/resume
  app.post("/resume", async (c) => {
    const walletAddress = c.get("walletAddress");

    try {
      const strategy = await getActiveStrategyByUserId(deps.db, walletAddress);

      if (!strategy) {
        return c.json(
          {
            status: "error",
            code: "account_not_ready",
            message: "No strategy found to resume.",
            retryable: false,
          },
          404,
        );
      }

      await updateStrategy(deps.db, strategy.id, walletAddress, {
        status: "active",
        updatedAt: new Date(),
      });

      const now = new Date().toISOString();

      return c.json({
        status: "success",
        command: {
          id: randomUUID(),
          commandType: "resume_bot",
          commandStatus: "completed",
          targetType: "bot",
          targetId: strategy.id,
          requestedAt: now,
          finishedAt: now,
          failureReason: null,
        },
        message: "Bot resumed.",
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error("[runtime/resume]", message);
      return c.json(
        {
          status: "error",
          code: "internal_error",
          message: "Failed to resume bot. Try again.",
          retryable: true,
        },
        500,
      );
    }
  });

  return app;
}
