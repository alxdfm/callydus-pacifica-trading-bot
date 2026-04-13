import { createHmac, timingSafeEqual } from "node:crypto";

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1h

export class BearerTokenService {
  constructor(private readonly signingSecret: string) {}

  issue(walletAddress: string, now: Date): string {
    const expiresAt = new Date(now.getTime() + TOKEN_TTL_MS).toISOString();
    const payload = `${walletAddress}:${expiresAt}`;
    const sig = createHmac("sha256", this.signingSecret)
      .update(payload)
      .digest("hex");
    return Buffer.from(`${payload}:${sig}`).toString("base64url");
  }

  verify(
    token: string,
  ): { valid: true; walletAddress: string } | { valid: false } {
    try {
      const raw = Buffer.from(token, "base64url").toString("utf8");
      const lastColon = raw.lastIndexOf(":");
      if (lastColon === -1) return { valid: false };

      const payload = raw.slice(0, lastColon);
      const sig = raw.slice(lastColon + 1);

      const expected = createHmac("sha256", this.signingSecret)
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
}
