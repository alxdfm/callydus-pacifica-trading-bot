import { describe, expect, it, vi } from "vitest";
import { createCleanupMarketData } from "./CleanupMarketData";

describe("createCleanupMarketData", () => {
  it("deletes old candles and refresh logs", async () => {
    const repository = {
      deleteOldCandles: vi.fn().mockResolvedValue({ deletedCount: 7 }),
      deleteOldRefreshLogs: vi.fn().mockResolvedValue({ deletedCount: 3 }),
    };

    const cleanup = createCleanupMarketData({
      repository: repository as never,
      now: () => new Date("2026-04-07T12:00:00.000Z"),
      logger: {
        info: vi.fn(),
      },
    });

    await expect(
      cleanup({
        candleRetentionMs: 7 * 24 * 60 * 60_000,
        refreshLogRetentionMs: 3 * 24 * 60 * 60_000,
      }),
    ).resolves.toEqual({
      status: "success",
      candlesDeleted: 7,
      refreshLogsDeleted: 3,
      executedAtIso: "2026-04-07T12:00:00.000Z",
    });
  });
});
