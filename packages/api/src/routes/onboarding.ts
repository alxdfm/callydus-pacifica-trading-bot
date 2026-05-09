import { Hono } from "hono";
import { randomUUID } from "node:crypto";
import type { AppDeps } from "../app.js";
import type { HonoEnv } from "../middleware/auth.js";
import {
  getAccountByWallet,
  getCredentialByAccountId,
  upsertAccount,
  upsertCredential,
  type Credential,
} from "../db/queries/accounts.js";
import { AesCredentialEncryptionService } from "../crypto/credential-encryption.js";
import {
  buildSigningKeyFromPrivateKey,
} from "../exchange/pacifica/signing.js";

function cleanBaseUrl(value: string): string {
  return value.trim().replace(/\/+$/, "");
}

async function parseResponseBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { raw: text };
  }
}

function deriveOnboardingStatus(credential: Credential | null): string {
  if (!credential) return "credentials_pending";
  if (!credential.operationallyVerified) return "credentials_validating";
  return "ready";
}

export function onboardingRoutes(deps: AppDeps): Hono<HonoEnv> {
  const app = new Hono<HonoEnv>();

  // POST /api/onboarding/account/lookup
  app.post("/account/lookup", async (c) => {
    let body: { walletAddress?: unknown };
    try {
      body = await c.req.json<{ walletAddress?: unknown }>();
    } catch {
      return c.json({ error: "Invalid JSON" }, 400);
    }

    const walletAddress = String(body.walletAddress ?? "").trim();

    if (!walletAddress) {
      return c.json(
        {
          status: "error",
          walletAddress: "",
          accountExists: false,
          code: "internal_error",
          message: "walletAddress is required.",
          retryable: false,
          canAccessProduct: false,
        },
        400,
      );
    }

    try {
      const account = await getAccountByWallet(deps.db, walletAddress);

      if (!account) {
        return c.json({
          status: "not_found",
          walletAddress,
          accountExists: false,
          canAccessProduct: false,
        });
      }

      const credential = await getCredentialByAccountId(deps.db, account.id);
      const onboardingStatus = deriveOnboardingStatus(credential);

      return c.json({
        status: "found",
        walletAddress,
        accountExists: true,
        onboardingStatus,
        credentialId: credential?.id ?? null,
        agentWalletPublicKey: credential?.publicKey ?? null,
        credentialAlias: credential?.credentialAlias ?? null,
        keyFingerprint: credential?.keyFingerprint ?? null,
        operationallyVerified: credential?.operationallyVerified ?? false,
        canAccessProduct: true,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error("[onboarding/account/lookup]", message);
      return c.json(
        {
          status: "error",
          walletAddress,
          accountExists: false,
          code: "internal_error",
          message: "An internal error occurred. Please try again.",
          retryable: false,
          canAccessProduct: false,
        },
        500,
      );
    }
  });

  // POST /api/onboarding/credentials/validate
  app.post("/credentials/validate", async (c) => {
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

    if (!mainWalletPublicKey) {
      return c.json(
        {
          status: "invalid",
          code: "wallet_not_connected",
          message: "Main wallet public key is required.",
          retryable: false,
          field: "mainWalletPublicKey",
          canProceed: false,
        },
        400,
      );
    }

    if (!agentWalletPublicKey) {
      return c.json(
        {
          status: "invalid",
          code: "invalid_agent_wallet_format",
          message: "Agent wallet public key is required.",
          retryable: false,
          field: "agentWalletPublicKey",
          canProceed: false,
        },
        400,
      );
    }

    if (!agentWalletPrivateKey) {
      return c.json(
        {
          status: "invalid",
          code: "invalid_agent_wallet_secret",
          message: "Agent wallet private key is required.",
          retryable: false,
          field: "agentWalletPrivateKey",
          canProceed: false,
        },
        400,
      );
    }

    let derivedPublicKey: string;
    try {
      const { publicKeyBase58 } = buildSigningKeyFromPrivateKey(agentWalletPrivateKey);
      derivedPublicKey = publicKeyBase58;
    } catch {
      return c.json(
        {
          status: "invalid",
          code: "invalid_agent_wallet_secret",
          message: "The agent wallet private key is invalid or malformed.",
          retryable: false,
          field: "agentWalletPrivateKey",
          canProceed: false,
        },
        400,
      );
    }

    if (derivedPublicKey !== agentWalletPublicKey) {
      return c.json(
        {
          status: "invalid",
          code: "agent_wallet_mismatch",
          message: "The agent wallet public key does not match the private key.",
          retryable: false,
          field: "agentWalletPublicKey",
          canProceed: false,
        },
        400,
      );
    }

    let encryptionService: AesCredentialEncryptionService;
    let encryptedSecret: { encryptedPrivateKeyRef: string; keyFingerprint: string };

    try {
      encryptionService = new AesCredentialEncryptionService(
        deps.env.CREDENTIAL_ENCRYPTION_KEY,
        deps.env.CREDENTIAL_ENCRYPTION_KEY_ID,
      );

      encryptedSecret = await encryptionService.encryptAgentWalletPrivateKey({
        agentWalletPublicKey,
        agentWalletPrivateKey,
      });
    } catch {
      return c.json(
        {
          status: "error",
          code: "provider_unavailable",
          message: "Credential storage is temporarily unavailable. Try again.",
          retryable: true,
          field: null,
          canProceed: false,
        },
        503,
      );
    }

    try {
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
        status: "valid",
        credentialId: credential.id,
        mainWalletPublicKey,
        agentWalletPublicKey,
        keyFingerprint: credential.keyFingerprint,
        validationStatus: "valid",
        validatedAt: now.toISOString(),
        canProceed: true,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error("[onboarding/credentials/validate]", message);
      return c.json(
        {
          status: "error",
          code: "provider_unavailable",
          message: "Credential storage is temporarily unavailable. Try again.",
          retryable: true,
          field: null,
          canProceed: false,
        },
        503,
      );
    }
  });

  // POST /api/onboarding/credentials/verify-operational
  app.post("/credentials/verify-operational", async (c) => {
    let body: { credentialId?: unknown };
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: "Invalid JSON" }, 400);
    }

    const credentialId = String(body.credentialId ?? "").trim();

    if (!credentialId) {
      return c.json(
        {
          status: "error",
          code: "internal_error",
          message: "credentialId is required.",
          retryable: false,
          canProceed: false,
        },
        400,
      );
    }

    // Find the credential by scanning accounts — we need to find the account that owns it
    // We query credential via a join approach: get credential directly by id from any account
    const { db } = deps;
    const { credentials } = await import("../db/schema.js");
    const { eq } = await import("drizzle-orm");

    const credRows = await db
      .select()
      .from(credentials)
      .where(eq(credentials.id, credentialId))
      .limit(1);

    const credential = credRows[0] ?? null;

    if (!credential) {
      return c.json(
        {
          status: "error",
          code: "credential_not_found",
          message: "Credential not found.",
          retryable: false,
          canProceed: false,
        },
        404,
      );
    }

    if (credential.validationStatus !== "valid") {
      return c.json(
        {
          status: "blocked",
          code: "credential_not_valid",
          message: "Credential has not passed validation.",
          retryable: false,
          canProceed: false,
        },
        400,
      );
    }

    // Fetch the account to get walletAddress
    const accountRows = await db
      .select()
      .from((await import("../db/schema.js")).accounts)
      .where(eq((await import("../db/schema.js")).accounts.id, credential.accountId))
      .limit(1);

    const account = accountRows[0] ?? null;

    if (!account) {
      return c.json(
        {
          status: "error",
          code: "credential_not_found",
          message: "Account not found for credential.",
          retryable: false,
          canProceed: false,
        },
        404,
      );
    }

    const walletAddress = account.walletAddress;

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
        {
          status: "error",
          code: "internal_error",
          message: "Failed to decrypt credential. Contact support.",
          retryable: false,
          canProceed: false,
        },
        500,
      );
    }

    const probeSymbol = deps.env.PACIFICA_OPERATIONAL_PROBE_SYMBOL.trim();
    const probePrice = deps.env.PACIFICA_OPERATIONAL_PROBE_PRICE.trim();
    const probeTargetNotionalUsd = deps.env.PACIFICA_OPERATIONAL_PROBE_TARGET_NOTIONAL_USD.trim();
    const probeTif = deps.env.PACIFICA_OPERATIONAL_PROBE_TIF;

    if (!probeSymbol || !probePrice || !probeTargetNotionalUsd) {
      return c.json(
        {
          status: "error",
          code: "internal_error",
          message: "Operational probe is not configured.",
          retryable: false,
          canProceed: false,
        },
        500,
      );
    }

    try {
      const { PacificaClient, findMarketInfo } = await import("../exchange/pacifica/client.js");

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
          {
            status: "blocked",
            code: "probe_market_config_invalid",
            message: "Probe market is not available.",
            retryable: false,
            canProceed: false,
          },
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
        status: "verified",
        credentialId: credential.id,
        operationalVerificationStatus: "verified",
        verifiedAt,
        probeSymbol,
        probeClientOrderId: clientOrderId,
        canProceed: true,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error("[onboarding/credentials/verify-operational]", message);
      return c.json(
        {
          status: "error",
          code: "internal_error",
          message: "Operational verification failed. Try again.",
          retryable: true,
          canProceed: false,
        },
        500,
      );
    }
  });

  // POST /api/onboarding/builder/approve
  app.post("/builder/approve", async (c) => {
    let body: {
      mainWalletPublicKey?: unknown;
      builderCode?: unknown;
      maxFeeRate?: unknown;
      timestamp?: unknown;
      expiryWindow?: unknown;
      signature?: unknown;
    };
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: "Invalid JSON" }, 400);
    }

    const mainWalletPublicKey = String(body.mainWalletPublicKey ?? "").trim();
    const builderCode = String(body.builderCode ?? "").trim();
    const maxFeeRate = String(body.maxFeeRate ?? "").trim();
    const timestamp = Number(body.timestamp);
    const expiryWindow = Number(body.expiryWindow);
    const signature = String(body.signature ?? "").trim();

    if (!mainWalletPublicKey) {
      return c.json(
        {
          status: "rejected",
          code: "wallet_not_connected",
          message: "Connect the main wallet before approving the builder code.",
          retryable: false,
          canProceed: false,
        },
        400,
      );
    }

    const envBuilderCode = deps.env.PACIFICA_BUILDER_CODE.trim();
    const envMaxFeeRate = deps.env.PACIFICA_BUILDER_MAX_FEE_RATE.trim();

    if (!envBuilderCode) {
      return c.json(
        {
          status: "error",
          code: "internal_error",
          message: "Builder approval failed due to an internal error.",
          retryable: false,
          canProceed: false,
        },
        500,
      );
    }

    if (builderCode !== envBuilderCode || maxFeeRate !== envMaxFeeRate) {
      return c.json(
        {
          status: "error",
          code: "internal_error",
          message: "Builder approval failed due to an internal error.",
          retryable: false,
          canProceed: false,
        },
        400,
      );
    }

    const baseUrl = cleanBaseUrl(deps.env.PACIFICA_REST_BASE_URL);

    let response: Response;
    try {
      response = await fetch(
        `${baseUrl}/api/v1/account/builder_codes/approve`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            account: mainWalletPublicKey,
            timestamp,
            expiry_window: expiryWindow,
            builder_code: builderCode,
            max_fee_rate: maxFeeRate,
            signature,
          }),
        },
      );
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Network failure.";
      console.error("[onboarding/builder/approve]", message);
      return c.json(
        {
          status: "error",
          code: "provider_unavailable",
          message: "Pacifica is temporarily unavailable. Try again.",
          retryable: true,
          canProceed: false,
        },
        503,
      );
    }

    const payload = await parseResponseBody(response);

    if (!response.ok) {
      if (response.status === 429) {
        return c.json(
          {
            status: "rejected",
            code: "rate_limited",
            message: "Pacifica rate limit reached. Try again shortly.",
            retryable: true,
            canProceed: false,
          },
          429,
        );
      }

      if (response.status >= 500) {
        return c.json(
          {
            status: "error",
            code: "provider_unavailable",
            message: "Pacifica is temporarily unavailable. Try again.",
            retryable: true,
            canProceed: false,
          },
          503,
        );
      }

      const serialized = JSON.stringify(payload ?? {}).toLowerCase();
      const errorCode =
        serialized.includes("verify") || serialized.includes("signature")
          ? "wallet_signature_rejected"
          : "builder_approval_rejected";

      return c.json(
        {
          status: "rejected",
          code: errorCode,
          message:
            errorCode === "wallet_signature_rejected"
              ? "The wallet signature was rejected or could not be verified by Pacifica."
              : "Pacifica rejected the builder approval request.",
          retryable: false,
          canProceed: false,
        },
        400,
      );
    }

    return c.json({
      status: "approved",
      mainWalletPublicKey,
      builderCode,
      approvedAt: new Date().toISOString(),
      canProceed: true,
    });
  });

  return app;
}
