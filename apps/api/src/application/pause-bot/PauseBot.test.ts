import { describe, expect, it, vi } from "vitest";
import { createPauseBot } from "./PauseBot";

describe("createPauseBot", () => {
  it("bloqueia pause sem wallet conectada", async () => {
    const pauseBot = createPauseBot({
      commandRepository: {
        pauseBot: vi.fn(),
      } as never,
    });

    await expect(pauseBot({ walletAddress: " " })).resolves.toEqual({
      status: "error",
      code: "wallet_not_connected",
      message: "Connect the main wallet before pausing the bot.",
      retryable: false,
    });
  });

  it("persiste comando de pause com rastreabilidade mínima", async () => {
    const repository = {
      pauseBot: vi.fn().mockResolvedValue({
        id: "command-1",
      }),
    };
    const pauseBot = createPauseBot({
      commandRepository: repository as never,
      now: () => new Date("2026-04-01T10:00:00.000Z"),
    });

    const result = await pauseBot({ walletAddress: "wallet-1" });

    expect(result.status).toBe("success");
    expect(repository.pauseBot).toHaveBeenCalledWith({
      walletAddress: "wallet-1",
      requestedBy: "app",
      nowIso: "2026-04-01T10:00:00.000Z",
      idempotencyKey: "pause-bot:wallet-1",
    });
  });

  it("deveria usar chave de idempotência estável por intenção, não por timestamp", async () => {
    const repository = {
      pauseBot: vi.fn().mockResolvedValue({
        id: "command-1",
      }),
    };
    const pauseBot = createPauseBot({
      commandRepository: repository as never,
      now: () => new Date("2026-04-01T10:00:00.000Z"),
    });

    await pauseBot({ walletAddress: "wallet-1" });

    expect(repository.pauseBot.mock.calls[0]?.[0].idempotencyKey).toBe(
      "pause-bot:wallet-1",
    );
  });
});
