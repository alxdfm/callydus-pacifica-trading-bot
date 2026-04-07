import { describe, expect, it, vi } from "vitest";
import { createResumeBot } from "./ResumeBot";

describe("createResumeBot", () => {
  it("bloqueia resume sem wallet conectada", async () => {
    const resumeBot = createResumeBot({
      commandRepository: {
        resumeBot: vi.fn(),
      } as never,
      startBotReadinessCheck: vi.fn(),
    });

    await expect(resumeBot({ walletAddress: " " })).resolves.toEqual({
      status: "error",
      code: "wallet_not_connected",
      message: "Connect the main wallet before resuming the bot.",
      retryable: false,
    });
  });

  it("persiste comando de resume com rastreabilidade mínima", async () => {
    const repository = {
      resumeBot: vi.fn().mockResolvedValue({
        id: "command-1",
      }),
    };
    const startBotReadinessCheck = vi.fn().mockResolvedValue({
      status: "success",
      readinessStatus: "passed",
      message: "ok",
      result: {},
    });
    const resumeBot = createResumeBot({
      commandRepository: repository as never,
      startBotReadinessCheck,
      now: () => new Date("2026-04-01T10:00:00.000Z"),
    });

    const result = await resumeBot({ walletAddress: "wallet-1" });

    expect(result.status).toBe("success");
    expect(repository.resumeBot).toHaveBeenCalledWith({
      walletAddress: "wallet-1",
      requestedBy: "app",
      nowIso: "2026-04-01T10:00:00.000Z",
      idempotencyKey: "resume-bot:wallet-1",
    });
    expect(startBotReadinessCheck).toHaveBeenCalledWith({
      walletAddress: "wallet-1",
    });
  });

  it("deveria usar chave de idempotência estável por intenção, não por timestamp", async () => {
    const repository = {
      resumeBot: vi.fn().mockResolvedValue({
        id: "command-1",
      }),
    };
    const startBotReadinessCheck = vi.fn().mockResolvedValue({
      status: "success",
      readinessStatus: "passed",
      message: "ok",
      result: {},
    });
    const resumeBot = createResumeBot({
      commandRepository: repository as never,
      startBotReadinessCheck,
      now: () => new Date("2026-04-01T10:00:00.000Z"),
    });

    await resumeBot({ walletAddress: "wallet-1" });

    expect(repository.resumeBot.mock.calls[0]?.[0].idempotencyKey).toBe(
      "resume-bot:wallet-1",
    );
  });

  it("bloqueia resume quando o readiness check falha por regra de negocio", async () => {
    const repository = {
      resumeBot: vi.fn(),
    };
    const resumeBot = createResumeBot({
      commandRepository: repository as never,
      startBotReadinessCheck: vi.fn().mockResolvedValue({
        status: "error",
        readinessStatus: "blocked",
        code: "trade_below_market_minimum",
        message: "Trade below market minimum.",
        retryable: false,
      }),
    });

    await expect(resumeBot({ walletAddress: "wallet-1" })).resolves.toEqual({
      status: "error",
      code: "account_not_ready",
      message: "Trade below market minimum.",
      retryable: false,
    });
    expect(repository.resumeBot).not.toHaveBeenCalled();
  });
});
