import { describe, it, expect } from "vitest";
import { issueToken, verifyToken } from "../auth.js";
import { createRateLimiter } from "../rate-limit.js";

const SECRET = "test-signing-secret-with-at-least-32-chars";
const WALLET = "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM";

describe("issueToken / verifyToken", () => {
  it("verifies a token it issued", () => {
    const { token, expiresAt } = issueToken(SECRET, WALLET, new Date());

    const result = verifyToken(SECRET, token);

    expect(result).toEqual({ valid: true, walletAddress: WALLET });
    expect(new Date(expiresAt).getTime()).toBeGreaterThan(Date.now());
  });

  it("rejects a token signed with a different secret", () => {
    const { token } = issueToken(SECRET, WALLET, new Date());

    const result = verifyToken("another-signing-secret-with-32-chars!", token);

    expect(result).toEqual({ valid: false });
  });

  it("rejects an expired token", () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    const { token } = issueToken(SECRET, WALLET, twoDaysAgo);

    expect(verifyToken(SECRET, token)).toEqual({ valid: false });
  });

  it("rejects a token with tampered payload", () => {
    const { token } = issueToken(SECRET, WALLET, new Date());
    const raw = Buffer.from(token, "base64url").toString("utf8");
    const tampered = Buffer.from(
      raw.replace(WALLET, "AttackerWallet1111111111111111111111111111"),
    ).toString("base64url");

    expect(verifyToken(SECRET, tampered)).toEqual({ valid: false });
  });

  it("rejects garbage input without throwing", () => {
    expect(verifyToken(SECRET, "not-a-token")).toEqual({ valid: false });
    expect(verifyToken(SECRET, "")).toEqual({ valid: false });
  });
});

describe("createRateLimiter", () => {
  it("allows requests under the limit", () => {
    const limiter = createRateLimiter({ windowMs: 60_000, max: 3 });
    const now = Date.now();

    expect(limiter.check("ip-1", now).allowed).toBe(true);
    expect(limiter.check("ip-1", now).allowed).toBe(true);
    expect(limiter.check("ip-1", now).allowed).toBe(true);
  });

  it("blocks requests over the limit with a retry hint", () => {
    const limiter = createRateLimiter({ windowMs: 60_000, max: 2 });
    const now = Date.now();

    limiter.check("ip-1", now);
    limiter.check("ip-1", now);
    const blocked = limiter.check("ip-1", now + 1_000);

    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSec).toBeGreaterThan(0);
  });

  it("tracks keys independently", () => {
    const limiter = createRateLimiter({ windowMs: 60_000, max: 1 });
    const now = Date.now();

    limiter.check("ip-1", now);
    expect(limiter.check("ip-1", now).allowed).toBe(false);
    expect(limiter.check("ip-2", now).allowed).toBe(true);
  });

  it("resets the counter after the window expires", () => {
    const limiter = createRateLimiter({ windowMs: 60_000, max: 1 });
    const now = Date.now();

    limiter.check("ip-1", now);
    expect(limiter.check("ip-1", now + 59_000).allowed).toBe(false);
    expect(limiter.check("ip-1", now + 60_000).allowed).toBe(true);
  });

  it("prune removes only expired windows", () => {
    const limiter = createRateLimiter({ windowMs: 60_000, max: 1 });
    const now = Date.now();

    limiter.check("old-ip", now);
    limiter.check("fresh-ip", now + 30_000);
    limiter.prune(now + 61_000);

    // old-ip expirou e foi removido — nova janela começa liberada
    expect(limiter.check("old-ip", now + 61_000).allowed).toBe(true);
    // fresh-ip continua na janela ativa
    expect(limiter.check("fresh-ip", now + 61_000).allowed).toBe(false);
  });
});
