import { randomUUID } from "node:crypto";
import type {
  PacificaOperationalVerificationPort,
  PacificaOperationalVerificationResult,
} from "../../domain/pacifica-operational/PacificaOperationalVerificationPort";
import type { ApiEnvironment } from "../config/createApiEnvironment";
import { PacificaApiError, PacificaClient } from "./PacificaClient";

export class PacificaOperationalVerificationGateway
  implements PacificaOperationalVerificationPort
{
  constructor(private readonly environment: ApiEnvironment) {}

  async verifyOperationalReadiness(input: {
    mainWalletPublicKey: string;
    agentWalletPublicKey: string;
    agentWalletPrivateKey: string;
  }): Promise<PacificaOperationalVerificationResult> {
    const probeSymbol = this.environment.pacificaOperationalProbeSymbol.trim();
    const probePrice = this.environment.pacificaOperationalProbePrice.trim();
    const probeTargetNotionalUsd =
      this.environment.pacificaOperationalProbeTargetNotionalUsd.trim();

    if (!probeSymbol || !probePrice || !probeTargetNotionalUsd) {
      return {
        ok: false,
        errorCode: "probe_market_config_invalid",
        probePayload: null,
      };
    }

    try {
      const client = new PacificaClient({
        apiBaseUrl: this.environment.pacificaRestBaseUrl,
        account: input.mainWalletPublicKey,
        privateKey: input.agentWalletPrivateKey,
        agentWallet: input.agentWalletPublicKey,
        expiryWindowMs: this.environment.pacificaSignatureExpiryWindowMs,
      });
      const marketInfoPayload = await client.getMarketInfo();
      const marketInfo = findMarketInfo(marketInfoPayload, probeSymbol);

      if (!marketInfo) {
        return {
          ok: false,
          errorCode: "probe_market_config_invalid",
          probePayload: {
            symbol: probeSymbol,
            reason: "market_not_found",
          },
        };
      }

      const normalizedProbe = buildProbeOrder({
        symbol: probeSymbol,
        price: probePrice,
        tickSize: marketInfo.tickSize,
        lotSize: marketInfo.lotSize,
        minOrderSize: marketInfo.minOrderSize,
        targetNotionalUsd: probeTargetNotionalUsd,
        tif: this.environment.pacificaOperationalProbeTif,
      });

      const clientOrderId = randomUUID();

      await client.createLimitOrder({
        symbol: normalizedProbe.symbol,
        side: "bid",
        amount: normalizedProbe.amount,
        price: normalizedProbe.price,
        tif: normalizedProbe.tif,
        clientOrderId,
      });

      await client.cancelOrder({
        symbol: normalizedProbe.symbol,
        clientOrderId,
      });

      return {
        ok: true,
        verifiedAt: new Date().toISOString(),
        probeSymbol: normalizedProbe.symbol,
        probeClientOrderId: clientOrderId,
        probePayload: {
          symbol: normalizedProbe.symbol,
          price: normalizedProbe.price,
          amount: normalizedProbe.amount,
          targetNotionalUsd: normalizedProbe.targetNotionalUsd,
          tif: normalizedProbe.tif,
          clientOrderId,
        },
      };
    } catch (error) {
      logOperationalVerificationError(input, error);

      return {
        ok: false,
        errorCode: mapOperationalError(error),
        probePayload: {
          symbol: probeSymbol,
          price: probePrice,
          targetNotionalUsd: probeTargetNotionalUsd,
        },
      };
    }
  }
}

type MarketInfo = {
  symbol: string;
  tickSize: string;
  lotSize: string;
  minOrderSize: string;
};

function findMarketInfo(payload: unknown, symbol: string): MarketInfo | null {
  const candidates = extractMarketInfoCandidates(payload);
  const normalizedSymbol = symbol.trim().toUpperCase();
  const match = candidates.find(
    (candidate) => candidate.symbol.toUpperCase() === normalizedSymbol,
  );

  if (!match) {
    return null;
  }

  return match;
}

function extractMarketInfoCandidates(payload: unknown): MarketInfo[] {
  const data =
    payload && typeof payload === "object" && "data" in payload
      ? (payload as { data?: unknown }).data
      : payload;

  const source = Array.isArray(data)
    ? data
    : data && typeof data === "object"
      ? Object.entries(data as Record<string, unknown>).map(([key, value]) => ({
          symbol: key,
          ...(value as Record<string, unknown>),
        }))
      : [];

  return source.flatMap((item) => {
    if (!item || typeof item !== "object") {
      return [];
    }

    const candidate = item as Record<string, unknown>;
    const symbol = String(candidate.symbol ?? candidate.name ?? "").trim();
    const tickSize = String(candidate.tick_size ?? candidate.tickSize ?? "").trim();
    const lotSize = String(candidate.lot_size ?? candidate.lotSize ?? "").trim();
    const minOrderSize = String(
      candidate.min_order_size ?? candidate.minOrderSize ?? "",
    ).trim();

    if (!symbol || !tickSize || !lotSize || !minOrderSize) {
      return [];
    }

    return [{ symbol, tickSize, lotSize, minOrderSize }];
  });
}

function buildProbeOrder(input: {
  symbol: string;
  price: string;
  tickSize: string;
  lotSize: string;
  minOrderSize: string;
  targetNotionalUsd: string;
  tif: "ALO" | "GTC" | "IOC";
}) {
  const price = Number(input.price);
  const tickSize = Number(input.tickSize);
  const lotSize = Number(input.lotSize);
  const minOrderSize = Number(input.minOrderSize);
  const targetNotionalUsd = Number(input.targetNotionalUsd);

  if (
    !Number.isFinite(price) ||
    !Number.isFinite(tickSize) ||
    !Number.isFinite(lotSize) ||
    !Number.isFinite(minOrderSize) ||
    !Number.isFinite(targetNotionalUsd) ||
    price <= 0 ||
    tickSize <= 0 ||
    lotSize <= 0 ||
    minOrderSize <= 0 ||
    targetNotionalUsd <= 0
  ) {
    throw new Error("Operational probe market config is invalid.");
  }

  const roundedPrice = roundUpToMultiple(price, tickSize);
  const effectiveNotionalUsd = Math.max(minOrderSize, targetNotionalUsd);
  const minimumAmount = effectiveNotionalUsd / roundedPrice;
  const roundedAmount = roundUpToMultiple(minimumAmount, lotSize);

  return {
    symbol: input.symbol,
    price: formatDecimal(roundedPrice, input.tickSize),
    amount: formatDecimal(roundedAmount, input.lotSize),
    targetNotionalUsd: formatDecimal(effectiveNotionalUsd, "1"),
    tif: input.tif,
  };
}

function roundUpToMultiple(value: number, step: number) {
  return Math.ceil(value / step) * step;
}

function formatDecimal(value: number, step: string) {
  const decimals = getDecimalPlaces(step);
  return value.toFixed(decimals);
}

function getDecimalPlaces(rawStep: string) {
  const normalized = rawStep.trim();

  if (!normalized.includes(".")) {
    return 0;
  }

  const decimalPart = normalized.split(".")[1];
  return decimalPart ? decimalPart.length : 0;
}

function mapOperationalError(error: unknown) {
  if (error instanceof PacificaApiError) {
    if (error.details.status === 429) {
      return "rate_limited" as const;
    }

    if (error.details.retryable) {
      return "provider_unavailable" as const;
    }

    const body = JSON.stringify(error.details.body ?? {}).toLowerCase();

    if (body.includes("verify") || body.includes("signature")) {
      return "signature_rejected" as const;
    }

    if (
      body.includes("unauthorized to sign on behalf of") ||
      (body.includes("unauthorized") && body.includes("sign on behalf"))
    ) {
      return "agent_wallet_unauthorized_for_account" as const;
    }

    if (
      body.includes("balance") ||
      body.includes("margin") ||
      body.includes("minimum") ||
      body.includes("min order") ||
      body.includes("lot") ||
      body.includes("tick") ||
      body.includes("price")
    ) {
      return "account_blocked" as const;
    }

    return "account_blocked" as const;
  }

  if (error instanceof Error) {
    if (error.message.toLowerCase().includes("config")) {
      return "probe_market_config_invalid" as const;
    }
  }

  return "internal_error" as const;
}

function logOperationalVerificationError(
  input: {
    mainWalletPublicKey: string;
    agentWalletPublicKey: string;
  },
  error: unknown,
) {
  console.error("[pacifica-operational-verification]", {
    mainWalletPublicKey: shortenPublicKey(input.mainWalletPublicKey),
    agentWalletPublicKey: shortenPublicKey(input.agentWalletPublicKey),
    error:
      error instanceof Error
        ? { name: error.name, message: error.message }
        : error,
  });
}

function shortenPublicKey(value: string) {
  const normalized = value.trim();

  if (normalized.length <= 10) {
    return normalized;
  }

  return `${normalized.slice(0, 4)}...${normalized.slice(-4)}`;
}
