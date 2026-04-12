import { randomUUID } from "node:crypto";
import { toPacificaMarketSymbol } from "@pacifica/preset-engine";
import { calculateTargetPositionSizing } from "@pacifica/pacifica-trading";
import type { MarketInfoItem, SymbolOperationalConfig } from "@pacifica/contracts";
import type {
  StartBotReadinessCheckResponse,
  StartBotReadinessCheckResult,
} from "../../application/start-bot-readiness-check/StartBotReadinessCheck";
import type { ApiEnvironment } from "../config/createApiEnvironment";
import { PacificaApiError, PacificaClient } from "./PacificaClient";

export class PacificaStartBotReadinessGateway {
  constructor(private readonly environment: ApiEnvironment) {}

  async listMarketInfo(): Promise<MarketInfoItem[]> {
    const payload = await this.getJson("/api/v1/info");
    return normalizeMarketInfo(payload);
  }

  async listEffectiveSymbolOperationalConfigs(
    walletAddress: string,
  ): Promise<SymbolOperationalConfig[]> {
    const [settingsPayload, infoPayload] = await Promise.all([
      this.getJson("/api/v1/account/settings", { account: walletAddress }),
      this.getJson("/api/v1/info"),
    ]);
    const markets = normalizeMarketInfo(infoPayload);

    return markets.map((market) => {
      const settings = normalizeSymbolSettings(settingsPayload, market.symbol);

      return {
        symbol: `${market.symbol}/USDC`,
        leverage: settings?.leverage ?? market.maxLeverage,
      };
    });
  }

  async runCheck(input: {
    walletAddress: string;
    agentWalletPublicKey: string;
    agentWalletPrivateKey: string;
    displaySymbol: string;
    positionSizeType: "fixed_amount" | "balance_percent";
    positionSizeValue: number;
    configuredLeverage: number | null;
    prices?: Array<{ symbol: string; markPrice: number }>;
  }): Promise<StartBotReadinessCheckResponse> {
    const marketSymbol = toPacificaMarketSymbol(input.displaySymbol);

    if (!marketSymbol) {
      return {
        status: "error",
        readinessStatus: "blocked",
        code: "market_not_found",
        message: "The selected preset symbol is not supported by Pacifica.",
        retryable: false,
      };
    }

    const [accountPayload, settingsPayload, infoPayload] = await Promise.all([
      this.getJson("/api/v1/account", { account: input.walletAddress }),
      this.getJson("/api/v1/account/settings", { account: input.walletAddress }),
      this.getJson("/api/v1/info"),
    ]);

    const market = normalizeMarketInfo(infoPayload).find(
      (candidate) => candidate.symbol === marketSymbol,
    );

    if (!market) {
      return {
        status: "error",
        readinessStatus: "blocked",
        code: "market_not_found",
        message: "The selected market is not available on Pacifica.",
        retryable: false,
      };
    }

    const availableBalance = normalizeAvailableBalance(accountPayload);
    const currentPrice = input.prices
      ? (input.prices.find((p) => p.symbol === marketSymbol)?.markPrice ?? null)
      : normalizeCurrentPrice(
          await this.getJson("/api/v1/info/prices"),
          marketSymbol,
        );

    if (availableBalance === null || currentPrice === null) {
      const missingInputs = [
        availableBalance === null ? "balance" : null,
        currentPrice === null ? "price" : null,
      ].filter((value): value is string => value !== null);

      return {
        status: "error",
        readinessStatus: "error",
        code: "account_settings_unavailable",
        message: `Could not resolve readiness input: ${missingInputs.join(" and ")}.`,
        retryable: true,
      };
    }

    const settings = normalizeSymbolSettings(settingsPayload, marketSymbol);
    const effectiveMarginMode = settings?.marginMode ?? "cross";
    const exchangeLeverage = settings?.leverage ?? market.maxLeverage;

    const sizing = calculateTargetPositionSizing({
      availableBalance,
      leverage: exchangeLeverage,
      positionSizeType: input.positionSizeType,
      positionSizeValue: input.positionSizeValue,
    });

    if (sizing.targetNotionalUsd < Number(market.minOrderSize)) {
      return {
        status: "error",
        readinessStatus: "blocked",
        code: "trade_below_market_minimum",
        message:
          `With the current balance and leverage, the calculated trade size is below Pacifica's minimum for ${input.displaySymbol}.`,
        retryable: false,
        result: buildPartialResult({
          displaySymbol: input.displaySymbol,
          market,
          currentPrice,
          availableBalance,
          positionSizeType: input.positionSizeType,
          positionSizeValue: input.positionSizeValue,
          leverageUsed: exchangeLeverage,
          leverageConfiguredByUser: input.configuredLeverage,
          targetInitialMarginUsd: sizing.targetInitialMarginUsd,
          targetNotionalUsd: sizing.targetNotionalUsd,
          marginMode: effectiveMarginMode,
        }),
      };
    }

    if (sizing.targetInitialMarginUsd > availableBalance) {
      return {
        status: "error",
        readinessStatus: "blocked",
        code: "insufficient_margin",
        message: "The account does not have enough available balance for this trade size.",
        retryable: false,
        result: buildPartialResult({
          displaySymbol: input.displaySymbol,
          market,
          currentPrice,
          availableBalance,
          positionSizeType: input.positionSizeType,
          positionSizeValue: input.positionSizeValue,
          leverageUsed: exchangeLeverage,
          leverageConfiguredByUser: input.configuredLeverage,
          targetInitialMarginUsd: sizing.targetInitialMarginUsd,
          targetNotionalUsd: sizing.targetNotionalUsd,
          marginMode: effectiveMarginMode,
        }),
      };
    }

    const probeLimitPriceValue = roundDownToMultiple(currentPrice * 0.8, Number(market.tickSize));
    const normalizedAmountValue = roundUpToMultiple(
      sizing.targetNotionalUsd / probeLimitPriceValue,
      Number(market.lotSize),
    );
    const probeLimitPrice = formatDecimal(probeLimitPriceValue, market.tickSize);
    const normalizedAmount = formatDecimal(normalizedAmountValue, market.lotSize);
    const probeClientOrderId = randomUUID();

    try {
      const client = new PacificaClient({
        apiBaseUrl: this.environment.pacificaRestBaseUrl,
        account: input.walletAddress,
        privateKey: input.agentWalletPrivateKey,
        agentWallet: input.agentWalletPublicKey,
        builderCode: this.environment.pacificaBuilderCode,
        expiryWindowMs: this.environment.pacificaSignatureExpiryWindowMs,
      });

      await client.createLimitOrder({
        symbol: market.symbol,
        side: "bid",
        amount: normalizedAmount,
        price: probeLimitPrice,
        tif: "ALO",
        clientOrderId: probeClientOrderId,
      });

      await client.cancelOrder({
        symbol: market.symbol,
        clientOrderId: probeClientOrderId,
      });
    } catch (error) {
      return {
        status: "error",
        readinessStatus: isRetryableError(error) ? "error" : "blocked",
        code: mapReadinessErrorCode(error),
        message: extractPacificaErrorMessage(error, "Start bot readiness check failed."),
        retryable: isRetryableError(error),
        result: {
          ...buildPartialResult({
            displaySymbol: input.displaySymbol,
            market,
            currentPrice,
            availableBalance,
            positionSizeType: input.positionSizeType,
            positionSizeValue: input.positionSizeValue,
            leverageUsed: exchangeLeverage,
            leverageConfiguredByUser: input.configuredLeverage,
            targetInitialMarginUsd: sizing.targetInitialMarginUsd,
            targetNotionalUsd: sizing.targetNotionalUsd,
            marginMode: effectiveMarginMode,
          }),
          probeLimitPrice: probeLimitPriceValue,
          normalizedAmount,
          probeClientOrderId,
          probeExecuted: false,
        },
      };
    }

    return {
      status: "success",
      readinessStatus: "passed",
      message: "Start bot readiness check passed.",
      result: {
        symbol: market.symbol,
        marketDisplaySymbol: input.displaySymbol,
        marginMode: effectiveMarginMode,
        leverageUsed: exchangeLeverage,
        leverageConfiguredByUser: input.configuredLeverage,
        availableBalanceUsed: availableBalance,
        positionSizeType: input.positionSizeType,
        positionSizeValue: input.positionSizeValue,
        targetInitialMarginUsd: sizing.targetInitialMarginUsd,
        targetNotionalUsd: sizing.targetNotionalUsd,
        marketMinOrderSizeUsd: Number(market.minOrderSize),
        marketMaxLeverage: market.maxLeverage,
        referencePrice: currentPrice,
        probeLimitPrice: probeLimitPriceValue,
        normalizedAmount,
        probeClientOrderId,
        probeExecuted: true,
      },
    };
  }

  private async getJson(
    path: string,
    query?: Record<string, string>,
  ): Promise<unknown> {
    const url = new URL(path, this.environment.pacificaRestBaseUrl);

    for (const [key, value] of Object.entries(query ?? {})) {
      url.searchParams.set(key, value);
    }

    const response = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
      },
    });
    const payload = await parseResponseBody(response);

    if (!response.ok) {
      throw new PacificaApiError(
        `Pacifica API request failed (${response.status}).`,
        {
          status: response.status,
          body: payload,
          retryable: response.status === 429 || response.status >= 500,
        },
      );
    }

    return payload;
  }
}

function normalizeMarketInfo(payload: unknown): MarketInfoItem[] {
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
    const maxLeverage = Number(
      candidate.max_leverage ?? candidate.maxLeverage ?? Number.NaN,
    );

    if (!symbol || !tickSize || !lotSize || !minOrderSize || !Number.isFinite(maxLeverage)) {
      return [];
    }

    return [{ symbol, tickSize, lotSize, minOrderSize, maxLeverage }];
  });
}

function normalizeAvailableBalance(payload: unknown) {
  const record = firstDataRecord(payload);

  if (!record) {
    return null;
  }

  return pickNumber(record, [
    "available_balance",
    "available_to_spend",
    "free_collateral",
    "available",
  ]);
}

function normalizeCurrentPrice(payload: unknown, symbol: string) {
  const data =
    payload && typeof payload === "object" && "data" in payload
      ? (payload as { data?: unknown }).data
      : payload;

  const rows = Array.isArray(data)
    ? data
    : data && typeof data === "object"
      ? Object.entries(data as Record<string, unknown>).map(([key, value]) => ({
          symbol: key,
          ...(value as Record<string, unknown>),
        }))
      : [];

  const row = rows.find((item) => {
    const candidateSymbol = String(
      (item as { symbol?: unknown } | null)?.symbol ?? "",
    ).trim();
    return candidateSymbol === symbol;
  }) as Record<string, unknown> | undefined;

  if (!row) {
    return null;
  }

  return (
    pickNumber(row, [
      "mark",
      "mark_price",
      "oracle",
      "oracle_price",
      "mid",
      "last_price",
    ]) ?? null
  );
}

function normalizeSymbolSettings(
  payload: unknown,
  symbol: string,
): { marginMode: "cross" | "isolated"; leverage: number } | null {
  const data =
    payload && typeof payload === "object" && "data" in payload
      ? (payload as { data?: unknown }).data
      : payload;

  const rows = Array.isArray(data)
    ? data
    : data && typeof data === "object"
      ? Object.entries(data as Record<string, unknown>).map(([key, value]) => ({
          symbol: key,
          ...(value as Record<string, unknown>),
        }))
      : [];

  const match = rows.find((item) => {
    const candidate = item as Record<string, unknown>;
    return String(candidate.symbol ?? "").trim() === symbol;
  }) as Record<string, unknown> | undefined;

  if (!match) {
    return null;
  }

  const leverage = Number(match.leverage ?? match.max_leverage ?? Number.NaN);
  const marginModeRaw = String(
    match.margin_mode ?? match.marginMode ?? "cross",
  ).trim().toLowerCase();
  const marginMode = marginModeRaw === "isolated" ? "isolated" : "cross";

  if (!Number.isFinite(leverage) || leverage <= 0) {
    return null;
  }

  return { marginMode, leverage };
}

function buildPartialResult(input: {
  displaySymbol: string;
  market: MarketInfoItem;
  currentPrice: number;
  availableBalance: number;
  positionSizeType: "fixed_amount" | "balance_percent";
  positionSizeValue: number;
  leverageUsed: number;
  leverageConfiguredByUser: number | null;
  targetInitialMarginUsd: number;
  targetNotionalUsd: number;
  marginMode?: "cross" | "isolated";
}): StartBotReadinessCheckResult {
  return {
    symbol: input.market.symbol,
    marketDisplaySymbol: input.displaySymbol,
    marginMode: input.marginMode ?? "cross",
    leverageUsed: input.leverageUsed,
    leverageConfiguredByUser: input.leverageConfiguredByUser,
    availableBalanceUsed: input.availableBalance,
    positionSizeType: input.positionSizeType,
    positionSizeValue: input.positionSizeValue,
    targetInitialMarginUsd: input.targetInitialMarginUsd,
    targetNotionalUsd: input.targetNotionalUsd,
    marketMinOrderSizeUsd: Number(input.market.minOrderSize),
    marketMaxLeverage: input.market.maxLeverage,
    referencePrice: input.currentPrice,
    probeLimitPrice: null,
    normalizedAmount: null,
    probeClientOrderId: null,
    probeExecuted: false,
  };
}

function firstDataRecord(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const data = "data" in payload ? (payload as { data?: unknown }).data : payload;

  if (Array.isArray(data)) {
    return (data[0] as Record<string, unknown> | undefined) ?? null;
  }

  if (data && typeof data === "object") {
    return data as Record<string, unknown>;
  }

  return null;
}

function pickNumber(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    const parsed = Number(value);

    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

async function parseResponseBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  const raw = await response.text();
  return raw ? { raw } : null;
}

function roundDownToMultiple(value: number, step: number) {
  return Math.floor(value / step) * step;
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

function isRetryableError(error: unknown) {
  return error instanceof PacificaApiError && error.details.retryable;
}

function mapReadinessErrorCode(error: unknown) {
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

    if (body.includes("unauthorized") && body.includes("sign")) {
      return "agent_wallet_unauthorized_for_account" as const;
    }

    if (body.includes("margin")) {
      return "insufficient_margin" as const;
    }
  }

  return "internal_error" as const;
}

function extractPacificaErrorMessage(error: unknown, fallback: string) {
  if (error instanceof PacificaApiError) {
    const apiMessage = (error.details.body as { error?: unknown } | null)?.error;

    if (typeof apiMessage === "string" && apiMessage.trim()) {
      return apiMessage;
    }

    const rawMessage = (error.details.body as { raw?: unknown } | null)?.raw;

    if (typeof rawMessage === "string" && rawMessage.trim()) {
      return rawMessage;
    }
  }

  return fallback;
}
