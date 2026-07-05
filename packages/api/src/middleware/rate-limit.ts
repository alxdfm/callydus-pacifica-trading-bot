import { createMiddleware } from "hono/factory";

// ---------------------------------------------------------------------------
// Rate limiting por IP (fixed window, in-memory)
//
// Limitação: o estado vive na instância do processo. Em Lambda cada instância
// tem seu próprio contador, então o limite efetivo global cresce com o
// scale-out — o throttling do API Gateway (sst.config.ts) é a proteção
// global; este middleware contém abuso por conexão e cobre o modo servidor.
// ---------------------------------------------------------------------------

export type RateLimitOptions = {
  windowMs: number;
  max: number;
};

type WindowEntry = {
  windowStartMs: number;
  count: number;
};

export function createRateLimiter(options: RateLimitOptions) {
  const windows = new Map<string, WindowEntry>();

  function check(key: string, nowMs: number): { allowed: boolean; retryAfterSec: number } {
    const entry = windows.get(key);

    if (!entry || nowMs - entry.windowStartMs >= options.windowMs) {
      windows.set(key, { windowStartMs: nowMs, count: 1 });
      return { allowed: true, retryAfterSec: 0 };
    }

    entry.count += 1;

    if (entry.count > options.max) {
      const retryAfterSec = Math.ceil(
        (entry.windowStartMs + options.windowMs - nowMs) / 1000,
      );
      return { allowed: false, retryAfterSec: Math.max(retryAfterSec, 1) };
    }

    return { allowed: true, retryAfterSec: 0 };
  }

  function prune(nowMs: number): void {
    for (const [key, entry] of windows) {
      if (nowMs - entry.windowStartMs >= options.windowMs) {
        windows.delete(key);
      }
    }
  }

  return { check, prune };
}

export function createRateLimitMiddleware(options: RateLimitOptions) {
  const limiter = createRateLimiter(options);
  let lastPruneMs = 0;

  return createMiddleware(async (c, next) => {
    const nowMs = Date.now();

    // Evita crescimento sem limite do Map em processos de vida longa
    if (nowMs - lastPruneMs >= options.windowMs) {
      limiter.prune(nowMs);
      lastPruneMs = nowMs;
    }

    const forwardedFor = c.req.header("x-forwarded-for");
    const clientIp = forwardedFor?.split(",")[0]?.trim() || "unknown";

    const result = limiter.check(clientIp, nowMs);

    if (!result.allowed) {
      c.header("Retry-After", String(result.retryAfterSec));
      return c.json(
        { status: "error", code: "rate_limited", message: "Too many requests." },
        429,
      );
    }

    await next();
  });
}
