import { Hono } from "hono";
import type { AppDeps } from "../app.js";
import type { HonoEnv } from "../middleware/auth.js";

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

export function builderRoutes(deps: AppDeps): Hono<HonoEnv> {
  const app = new Hono<HonoEnv>();

  // POST /api/builder/approve
  app.post("/approve", async (c) => {
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
      console.error("[builder-approve]", message);
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
