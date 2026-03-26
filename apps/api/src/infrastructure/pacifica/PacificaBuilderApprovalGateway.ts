import type {
  PacificaBuilderApprovalPort,
  PacificaBuilderApprovalResult,
} from "../../domain/pacifica-builder/PacificaBuilderApprovalPort";
import type { ApiEnvironment } from "../config/createApiEnvironment";

export class PacificaBuilderApprovalGateway
  implements PacificaBuilderApprovalPort
{
  constructor(private readonly environment: ApiEnvironment) {}

  async approveBuilderCode(input: {
    mainWalletPublicKey: string;
    builderCode: string;
    maxFeeRate: string;
    timestamp: number;
    expiryWindow: number;
    signature: string;
  }): Promise<PacificaBuilderApprovalResult> {
    if (!this.environment.pacificaBuilderCode.trim()) {
      logBuilderApprovalError("Missing PACIFICA_BUILDER_CODE.", input);
      return { ok: false, errorCode: "internal_error" };
    }

    if (!this.environment.pacificaBuilderMaxFeeRate.trim()) {
      logBuilderApprovalError(
        "Missing PACIFICA_BUILDER_MAX_FEE_RATE.",
        input,
      );
      return { ok: false, errorCode: "internal_error" };
    }

    if (
      input.builderCode.trim() !== this.environment.pacificaBuilderCode.trim() ||
      input.maxFeeRate.trim() !==
        this.environment.pacificaBuilderMaxFeeRate.trim()
    ) {
      logBuilderApprovalError("Frontend builder config mismatch.", input);
      return { ok: false, errorCode: "internal_error" };
    }

    const response = await fetch(
      `${cleanBaseUrl(this.environment.pacificaRestBaseUrl)}/api/v1/account/builder_codes/approve`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          account: input.mainWalletPublicKey,
          timestamp: input.timestamp,
          expiry_window: input.expiryWindow,
          builder_code: input.builderCode,
          max_fee_rate: input.maxFeeRate,
          signature: input.signature,
        }),
      },
    ).catch((error: unknown) => {
      throw new Error(
        error instanceof Error ? error.message : "Pacifica network failure.",
      );
    });

    const payload = await parseResponseBody(response);

    if (!response.ok) {
      logBuilderApprovalError(
        "Pacifica builder approval failed.",
        input,
        response.status,
        payload,
      );

      if (response.status === 429) {
        return { ok: false, errorCode: "rate_limited" };
      }

      if (response.status >= 500) {
        return { ok: false, errorCode: "provider_unavailable" };
      }

      const serializedPayload = JSON.stringify(payload ?? {}).toLowerCase();

      if (
        serializedPayload.includes("verify") ||
        serializedPayload.includes("signature")
      ) {
        return { ok: false, errorCode: "wallet_signature_rejected" };
      }

      return { ok: false, errorCode: "builder_approval_rejected" };
    }

    return {
      ok: true,
      approvedAt: new Date().toISOString(),
    };
  }
}

function cleanBaseUrl(value: string) {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

async function parseResponseBody(response: Response): Promise<unknown> {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { raw: text };
  }
}

function logBuilderApprovalError(
  message: string,
  input: {
    mainWalletPublicKey: string;
    builderCode: string;
    maxFeeRate: string;
  },
  status?: number,
  payload?: unknown,
) {
  console.error("[pacifica-builder-approval]", {
    message,
    mainWalletPublicKey: shortenPublicKey(input.mainWalletPublicKey),
    builderCode: input.builderCode,
    maxFeeRate: input.maxFeeRate,
    status,
    payload,
  });
}

function shortenPublicKey(value: string) {
  const normalized = value.trim();

  if (normalized.length <= 10) {
    return normalized;
  }

  return `${normalized.slice(0, 4)}...${normalized.slice(-4)}`;
}
