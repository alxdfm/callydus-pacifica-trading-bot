import { Hono } from "hono";
import { randomUUID } from "node:crypto";
import { ed25519 } from "@noble/curves/ed25519";
import bs58 from "bs58";
import type { AppDeps } from "../app.js";
import type { HonoEnv } from "../middleware/auth.js";
import { issueToken } from "../middleware/auth.js";
import { upsertNonce, consumeNonce } from "../db/queries/accounts.js";
import {
  getAccountByWallet,
  upsertAccount,
  getCredentialByAccountId,
  upsertCredential,
} from "../db/queries/accounts.js";
import { AesCredentialEncryptionService } from "../crypto/credential-encryption.js";
import {
  buildSigningKeyFromPrivateKey,
  derivePublicKeyBase58,
} from "../exchange/pacifica/signing.js";

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

  // POST /api/auth/nonce
  app.post("/nonce", async (c) => {
    let body: { walletAddress?: unknown };
    try {
      body = await c.req.json<{ walletAddress?: unknown }>();
    } catch {
      return c.json({ error: "Invalid JSON" }, 400);
    }

    const walletAddress = String(body.walletAddress ?? "").trim();

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

  // POST /api/auth/credentials
  app.post("/credentials", async (c) => {
    let body: {
      mainWalletPublicKey?: unknown;
      agentWalletPublicKey?: unknown;
      agentWalletPrivateKey?: unknown;
      credentialAlias?: unknown;
    };
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: "Invalid JSON" }, 400);
    }

    const mainWalletPublicKey = String(body.mainWalletPublicKey ?? "").trim();
    const agentWalletPublicKey = String(body.agentWalletPublicKey ?? "").trim();
    const agentWalletPrivateKey = String(body.agentWalletPrivateKey ?? "").trim();
    const credentialAlias =
      body.credentialAlias != null
        ? String(body.credentialAlias).trim() || null
        : null;

    if (!mainWalletPublicKey || !agentWalletPublicKey || !agentWalletPrivateKey) {
      return c.json(
        { ok: false, validationStatus: "invalid", errorCode: "missing_fields" },
        400,
      );
    }

    // Validate: derive public key from private key
    let derivedPublicKey: string;
    try {
      const { publicKeyBase58 } = buildSigningKeyFromPrivateKey(agentWalletPrivateKey);
      derivedPublicKey = publicKeyBase58;
    } catch {
      return c.json(
        { ok: false, validationStatus: "invalid", errorCode: "invalid_agent_wallet_secret" },
        400,
      );
    }

    if (derivedPublicKey !== agentWalletPublicKey) {
      return c.json(
        { ok: false, validationStatus: "invalid", errorCode: "agent_wallet_mismatch" },
        400,
      );
    }

    const encryptionService = new AesCredentialEncryptionService(
      deps.env.CREDENTIAL_ENCRYPTION_KEY,
      deps.env.CREDENTIAL_ENCRYPTION_KEY_ID,
    );

    const encryptedSecret = await encryptionService.encryptAgentWalletPrivateKey({
      agentWalletPublicKey,
      agentWalletPrivateKey,
    });

    const account = await upsertAccount(deps.db, mainWalletPublicKey, {
      onboardingStatus: "ready",
    });

    const credentialId = randomUUID();
    const now = new Date();
    const credential = await upsertCredential(deps.db, {
      id: credentialId,
      accountId: account.id,
      publicKey: agentWalletPublicKey,
      encryptedPrivateKeyRef: encryptedSecret.encryptedPrivateKeyRef,
      keyFingerprint: encryptedSecret.keyFingerprint,
      credentialAlias,
      validationStatus: "valid",
      lifecycleStatus: "active",
      operationallyVerified: false,
      lastValidatedAt: now,
      lastValidationErrorCode: null,
    });

    return c.json({
      ok: true,
      credentialId: credential.id,
      keyFingerprint: credential.keyFingerprint,
      validationStatus: "valid",
      validatedAt: now.toISOString(),
      reusedExistingCredential: false,
    });
  });

  // POST /api/auth/verify-operational
  app.post("/verify-operational", async (c) => {
    let body: { credentialId?: unknown; walletAddress?: unknown };
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: "Invalid JSON" }, 400);
    }

    const credentialId = String(body.credentialId ?? "").trim();
    const walletAddress = String(body.walletAddress ?? "").trim();

    if (!credentialId || !walletAddress) {
      return c.json(
        { ok: false, operationalVerificationStatus: "error", errorCode: "missing_fields" },
        400,
      );
    }

    const account = await getAccountByWallet(deps.db, walletAddress);

    if (!account) {
      return c.json(
        { ok: false, operationalVerificationStatus: "error", errorCode: "credential_not_found" },
        404,
      );
    }

    const credential = await getCredentialByAccountId(deps.db, account.id);

    if (!credential || credential.id !== credentialId) {
      return c.json(
        { ok: false, operationalVerificationStatus: "error", errorCode: "credential_not_found" },
        404,
      );
    }

    if (credential.validationStatus !== "valid") {
      return c.json(
        { ok: false, operationalVerificationStatus: "blocked", errorCode: "credential_not_valid" },
        400,
      );
    }

    const encryptionService = new AesCredentialEncryptionService(
      deps.env.CREDENTIAL_ENCRYPTION_KEY,
      deps.env.CREDENTIAL_ENCRYPTION_KEY_ID,
    );

    let decryptedPrivateKey: string;
    try {
      decryptedPrivateKey = await encryptionService.decryptAgentWalletPrivateKey({
        encryptedPrivateKeyRef: credential.encryptedPrivateKeyRef,
      });
    } catch {
      return c.json(
        { ok: false, operationalVerificationStatus: "error", errorCode: "internal_error" },
        500,
      );
    }

    // Operational probe via Pacifica
    const probeSymbol = deps.env.PACIFICA_OPERATIONAL_PROBE_SYMBOL.trim();
    const probePrice = deps.env.PACIFICA_OPERATIONAL_PROBE_PRICE.trim();
    const probeTargetNotionalUsd = deps.env.PACIFICA_OPERATIONAL_PROBE_TARGET_NOTIONAL_USD.trim();
    const probeTif = deps.env.PACIFICA_OPERATIONAL_PROBE_TIF;

    if (!probeSymbol || !probePrice || !probeTargetNotionalUsd) {
      return c.json(
        { ok: false, operationalVerificationStatus: "error", errorCode: "probe_market_config_invalid" },
        500,
      );
    }

    try {
      const { PacificaClient } = await import("../exchange/pacifica/client.js");
      const { findMarketInfo } = await import("../exchange/pacifica/client.js");

      const client = new PacificaClient({
        apiBaseUrl: deps.env.PACIFICA_REST_BASE_URL,
        account: walletAddress,
        privateKey: decryptedPrivateKey,
        agentWallet: credential.publicKey,
        builderCode: deps.env.PACIFICA_BUILDER_CODE,
        expiryWindowMs: deps.env.PACIFICA_SIGNATURE_EXPIRY_WINDOW_MS,
      });

      const marketInfoPayload = await client.getMarketInfo();
      const marketInfo = findMarketInfo(marketInfoPayload, probeSymbol);

      if (!marketInfo) {
        return c.json(
          { ok: false, operationalVerificationStatus: "blocked", errorCode: "probe_market_config_invalid" },
          400,
        );
      }

      const price = Number(probePrice);
      const tickSize = Number(marketInfo.tickSize);
      const lotSize = Number(marketInfo.lotSize);
      const minOrderSize = Number(marketInfo.minOrderSize);
      const targetNotionalUsd = Number(probeTargetNotionalUsd);

      const roundedPrice = Math.ceil(price / tickSize) * tickSize;
      const effectiveNotionalUsd = Math.max(minOrderSize, targetNotionalUsd);
      const minimumAmount = effectiveNotionalUsd / roundedPrice;
      const roundedAmount = Math.ceil(minimumAmount / lotSize) * lotSize;

      const getPriceDecimals = (step: string) => {
        const d = step.trim().split(".")[1];
        return d ? d.length : 0;
      };

      const clientOrderId = randomUUID();

      await client.createLimitOrder({
        symbol: probeSymbol,
        side: "bid",
        amount: roundedAmount.toFixed(getPriceDecimals(marketInfo.lotSize)),
        price: roundedPrice.toFixed(getPriceDecimals(marketInfo.tickSize)),
        tif: probeTif,
        clientOrderId,
      });

      await client.cancelOrder({ symbol: probeSymbol, clientOrderId });

      const verifiedAt = new Date().toISOString();

      await upsertCredential(deps.db, {
        id: credential.id,
        accountId: credential.accountId,
        publicKey: credential.publicKey,
        encryptedPrivateKeyRef: credential.encryptedPrivateKeyRef,
        keyFingerprint: credential.keyFingerprint,
        credentialAlias: credential.credentialAlias,
        validationStatus: "valid",
        lifecycleStatus: "active",
        operationallyVerified: true,
        lastOperationalVerifiedAt: new Date(verifiedAt),
        lastOperationalErrorCode: null,
        lastOperationalProbeJson: { symbol: probeSymbol, clientOrderId },
      });

      return c.json({
        ok: true,
        credentialId: credential.id,
        operationalVerificationStatus: "verified",
        verifiedAt,
        probeSymbol,
        probeClientOrderId: clientOrderId,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error("[verify-operational]", message);
      return c.json(
        { ok: false, operationalVerificationStatus: "error", errorCode: "internal_error" },
        500,
      );
    }
  });

  return app;
}
