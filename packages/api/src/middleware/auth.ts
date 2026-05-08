import { createMiddleware } from "hono/factory";
import { createHmac, timingSafeEqual } from "node:crypto";
import type { AppDeps } from "../app.js";

// ---------------------------------------------------------------------------
// HonoEnv type (exported for use in routes)
// ---------------------------------------------------------------------------

export type HonoEnv = {
  Variables: {
    walletAddress: string;
  };
};

// ---------------------------------------------------------------------------
// Token service (inline — no DB lookup needed)
// ---------------------------------------------------------------------------

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24h

export function issueToken(
  signingSecret: string,
  walletAddress: string,
  now: Date,
): { token: string; expiresAt: string } {
  const expiresAt = new Date(now.getTime() + TOKEN_TTL_MS).toISOString();
  const payload = `${walletAddress}:${expiresAt}`;
  const sig = createHmac("sha256", signingSecret).update(payload).digest("hex");
  const token = Buffer.from(`${payload}:${sig}`).toString("base64url");
  return { token, expiresAt };
}

export function verifyToken(
  signingSecret: string,
  token: string,
): { valid: true; walletAddress: string } | { valid: false } {
  try {
    const raw = Buffer.from(token, "base64url").toString("utf8");
    const lastColon = raw.lastIndexOf(":");
    if (lastColon === -1) return { valid: false };

    const payload = raw.slice(0, lastColon);
    const sig = raw.slice(lastColon + 1);

    const expected = createHmac("sha256", signingSecret)
      .update(payload)
      .digest("hex");

    const sigBuf = Buffer.from(sig, "hex");
    const expectedBuf = Buffer.from(expected, "hex");

    if (
      sigBuf.length !== expectedBuf.length ||
      !timingSafeEqual(sigBuf, expectedBuf)
    ) {
      return { valid: false };
    }

    const firstColon = payload.indexOf(":");
    if (firstColon === -1) return { valid: false };

    const walletAddress = payload.slice(0, firstColon);
    const expiresAt = payload.slice(firstColon + 1);

    if (new Date(expiresAt) < new Date()) return { valid: false };

    return { valid: true, walletAddress };
  } catch {
    return { valid: false };
  }
}

// ---------------------------------------------------------------------------
// Middleware factory
// ---------------------------------------------------------------------------

export function createAuthMiddleware(deps: AppDeps) {
  return createMiddleware<HonoEnv>(async (c, next) => {
    const authHeader = c.req.header("Authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const token = authHeader.slice(7);
    const result = verifyToken(deps.env.CREDENTIAL_ENCRYPTION_KEY, token);

    if (!result.valid) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    c.set("walletAddress", result.walletAddress);
    await next();
  });
}
