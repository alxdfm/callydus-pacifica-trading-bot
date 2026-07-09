import { Hono } from "hono";
import { randomUUID } from "node:crypto";
import { ed25519 } from "@noble/curves/ed25519";
import bs58 from "bs58";
import type { AppDeps } from "../app.js";
import type { HonoEnv } from "../middleware/auth.js";
import { issueToken } from "../middleware/auth.js";
import { upsertNonce, consumeNonce } from "../db/queries/accounts.js";
import { upsertAccount } from "../db/queries/accounts.js";

const NONCE_TTL_MS = 5 * 60 * 1000;
const WALLET_ADDRESS_REGEX = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

function buildSignInMessage(input: {
  walletAddress: string;
  nonce: string;
  expiresAt: string;
}): string {
  return [
    "Sign in to Callydus Trading",
    `Wallet: ${input.walletAddress}`,
    `Nonce: ${input.nonce}`,
    `Expires: ${input.expiresAt}`,
  ].join("\n");
}

function verifySolanaWalletSignature(input: {
  walletAddress: string;
  message: string;
  signature: string;
}): boolean {
  try {
    const publicKeyBytes = bs58.decode(input.walletAddress);
    const messageBytes = new TextEncoder().encode(input.message);
    const signatureBytes = Buffer.from(input.signature, "base64");
    return ed25519.verify(signatureBytes, messageBytes, publicKeyBytes);
  } catch {
    return false;
  }
}

export function authRoutes(deps: AppDeps): Hono<HonoEnv> {
  const app = new Hono<HonoEnv>();

  // GET /api/auth/nonce?wallet=<walletAddress>
  app.get("/nonce", async (c) => {
    const walletAddress = (c.req.query("wallet") ?? "").trim();

    if (!WALLET_ADDRESS_REGEX.test(walletAddress)) {
      return c.json(
        { status: "error", code: "invalid_wallet_address", message: "Invalid wallet address format." },
        400,
      );
    }

    const nonce = randomUUID();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + NONCE_TTL_MS);
    const message = buildSignInMessage({
      walletAddress,
      nonce,
      expiresAt: expiresAt.toISOString(),
    });

    await upsertNonce(deps.db, { walletAddress, nonce, expiresAt });

    return c.json({
      status: "ok",
      nonce,
      expiresAt: expiresAt.toISOString(),
      message,
    });
  });

  // POST /api/auth/verify
  app.post("/verify", async (c) => {
    let body: { walletAddress?: unknown; nonce?: unknown; expiresAt?: unknown; signature?: unknown };
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: "Invalid JSON" }, 400);
    }

    const walletAddress = String(body.walletAddress ?? "").trim();
    const nonce = String(body.nonce ?? "").trim();
    const expiresAt = String(body.expiresAt ?? "").trim();
    const signature = String(body.signature ?? "").trim();

    if (!walletAddress || !nonce || !expiresAt || !signature) {
      return c.json(
        { status: "error", code: "missing_fields", message: "Missing required fields." },
        400,
      );
    }

    const consumed = await consumeNonce(deps.db, nonce, walletAddress);

    if (!consumed.valid) {
      return c.json(
        { status: "error", code: "invalid_nonce", message: "Nonce is invalid, expired, or already used." },
        400,
      );
    }

    const message = buildSignInMessage({ walletAddress, nonce, expiresAt });
    const signatureValid = verifySolanaWalletSignature({ walletAddress, message, signature });

    if (!signatureValid) {
      return c.json(
        { status: "error", code: "invalid_signature", message: "Signature verification failed." },
        400,
      );
    }

    const { token, expiresAt: tokenExpiresAt } = issueToken(
      deps.env.AUTH_SIGNING_SECRET,
      walletAddress,
      new Date(),
    );

    // Ensure account exists
    await upsertAccount(deps.db, walletAddress, {});

    return c.json({ status: "ok", token, expiresAt: tokenExpiresAt });
  });

  return app;
}
