import { buildSigningKeyFromPrivateKey, signPayload } from "./signing.js";
import type { KeyObject } from "node:crypto";

// ---------------------------------------------------------------------------
// Error
// ---------------------------------------------------------------------------

export class PacificaApiError extends Error {
  constructor(
    message: string,
    readonly details: {
      status: number | null;
      body: unknown;
      retryable: boolean;
    },
  ) {
    super(message);
    this.name = "PacificaApiError";
  }
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PacificaClientInput = {
  apiBaseUrl: string;
  account: string;
  privateKey: string;
  agentWallet: string;
  builderCode?: string | null;
  expiryWindowMs: number;
};

export type PacificaMarketInfo = {
  symbol: string;
  tickSize: string;
  lotSize: string;
  minOrderSize: string;
};

export type PacificaPosition = {
  symbol: string;
  side: "bid" | "ask";
  amount: string;
  entryPrice: string | null;
};

// ---------------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------------

export class PacificaClient {
  private readonly apiBaseUrl: string;
  private readonly account: string;
  private readonly agentWallet: string;
  private readonly builderCode: string | null;
  private readonly expiryWindowMs: number;
  private readonly signingKey: KeyObject;
  private readonly signerPublicKey: string;

  constructor(input: PacificaClientInput) {
    this.apiBaseUrl = cleanBaseUrl(input.apiBaseUrl);
    this.account = normalizeAddress(input.account);
    this.agentWallet = normalizeAddress(input.agentWallet);
    this.builderCode = normalizeOptionalString(input.builderCode);
    this.expiryWindowMs = input.expiryWindowMs;

    const { signingKey, publicKeyBase58 } = buildSigningKeyFromPrivateKey(
      input.privateKey,
    );
    this.signingKey = signingKey;
    this.signerPublicKey = publicKeyBase58;

    if (
      this.signerPublicKey !== this.account &&
      this.signerPublicKey !== this.agentWallet
    ) {
      throw new Error(
        `Pacifica signer key mismatch: derived=${this.signerPublicKey}, account=${this.account}, agent_wallet=${this.agentWallet}`,
      );
    }
  }

  async getMarketInfo(): Promise<unknown> {
    const response = await fetch(`${this.apiBaseUrl}/api/v1/info`);
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

  async createLimitOrder(input: {
    symbol: string;
    side: "bid" | "ask";
    amount: string;
    price: string;
    tif?: "ALO" | "GTC" | "IOC";
    clientOrderId: string;
  }): Promise<unknown> {
    return this.requestSigned({
      path: "/api/v1/orders/create",
      operationType: "create_order",
      data: {
        symbol: input.symbol,
        side: input.side,
        amount: input.amount,
        price: input.price,
        tif: input.tif ?? "ALO",
        reduce_only: false,
        client_order_id: input.clientOrderId,
        ...(this.builderCode ? { builder_code: this.builderCode } : {}),
      },
    });
  }

  async createMarketOrder(input: {
    symbol: string;
    side: "bid" | "ask";
    amount: string;
    slippagePercent: string;
    clientOrderId: string;
    reduceOnly?: boolean;
    takeProfit?:
      | {
          stopPrice: string;
          limitPrice?: string | null;
          clientOrderId?: string | null;
        }
      | null;
    stopLoss?:
      | {
          stopPrice: string;
          limitPrice?: string | null;
          clientOrderId?: string | null;
        }
      | null;
  }): Promise<unknown> {
    return this.requestSigned({
      path: "/api/v1/orders/create_market",
      operationType: "create_market_order",
      data: {
        symbol: input.symbol,
        side: input.side,
        amount: input.amount,
        slippage_percent: input.slippagePercent,
        reduce_only: Boolean(input.reduceOnly),
        client_order_id: input.clientOrderId,
        ...(input.takeProfit
          ? {
              take_profit: {
                stop_price: input.takeProfit.stopPrice,
                ...(input.takeProfit.limitPrice
                  ? { limit_price: input.takeProfit.limitPrice }
                  : {}),
                ...(input.takeProfit.clientOrderId
                  ? { client_order_id: input.takeProfit.clientOrderId }
                  : {}),
              },
            }
          : {}),
        ...(input.stopLoss
          ? {
              stop_loss: {
                stop_price: input.stopLoss.stopPrice,
                ...(input.stopLoss.limitPrice
                  ? { limit_price: input.stopLoss.limitPrice }
                  : {}),
                ...(input.stopLoss.clientOrderId
                  ? { client_order_id: input.stopLoss.clientOrderId }
                  : {}),
              },
            }
          : {}),
        ...(this.builderCode ? { builder_code: this.builderCode } : {}),
      },
    });
  }

  async setPositionTpsl(input: {
    symbol: string;
    side: "bid" | "ask";
    takeProfit?:
      | {
          stopPrice: string;
          limitPrice?: string | null;
          clientOrderId?: string | null;
        }
      | null;
    stopLoss?:
      | {
          stopPrice: string;
          limitPrice?: string | null;
          clientOrderId?: string | null;
        }
      | null;
  }): Promise<unknown> {
    return this.requestSigned({
      path: "/api/v1/positions/tpsl",
      operationType: "set_position_tpsl",
      data: {
        symbol: input.symbol,
        side: input.side,
        ...(input.takeProfit
          ? {
              take_profit: {
                stop_price: input.takeProfit.stopPrice,
                ...(input.takeProfit.clientOrderId
                  ? { client_order_id: input.takeProfit.clientOrderId }
                  : {}),
              },
            }
          : {}),
        ...(input.stopLoss
          ? {
              stop_loss: {
                stop_price: input.stopLoss.stopPrice,
                ...(input.stopLoss.clientOrderId
                  ? { client_order_id: input.stopLoss.clientOrderId }
                  : {}),
              },
            }
          : {}),
        ...(this.builderCode ? { builder_code: this.builderCode } : {}),
      },
    });
  }

  async getPositions(): Promise<PacificaPosition[]> {
    const params = new URLSearchParams({ account: this.account });
    const response = await fetch(
      `${this.apiBaseUrl}/api/v1/positions?${params.toString()}`,
      {
        headers: {
          Accept: "application/json",
        },
      },
    );
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

    const data =
      payload && typeof payload === "object" && "data" in payload
        ? (payload as { data?: unknown }).data
        : payload;

    if (!Array.isArray(data)) {
      return [];
    }

    return data.flatMap((entry) => {
      if (!entry || typeof entry !== "object") {
        return [];
      }

      const row = entry as Record<string, unknown>;
      const symbol = String(row.symbol ?? "").trim();
      const side = normalizePositionSide(
        row.side,
        row.position_side,
        row.amount ?? row.size ?? row.position,
      );
      const amount = normalizePositionAmount(
        row.amount ?? row.size ?? row.position,
      );
      const entryPrice = normalizePositionEntryPrice(
        row.entry_price ?? row.avg_entry_price,
      );

      if (!symbol || !side || !amount) {
        return [];
      }

      return [{ symbol, side, amount, entryPrice }];
    });
  }

  async cancelOrder(input: {
    symbol: string;
    clientOrderId: string;
  }): Promise<unknown> {
    return this.requestSigned({
      path: "/api/v1/orders/cancel",
      operationType: "cancel_order",
      data: {
        symbol: input.symbol,
        client_order_id: input.clientOrderId,
      },
    });
  }

  async getCandles(input: {
    symbol: string;
    interval: string;
    startTime?: number;
    endTime?: number;
    limit?: number;
  }): Promise<
    Array<{
      symbol: string;
      interval: string;
      openTime: number;
      closeTime: number;
      open: number;
      high: number;
      low: number;
      close: number;
      volume: number;
    }>
  > {
    const params = new URLSearchParams({
      symbol: input.symbol,
      interval: input.interval,
    });

    if (input.startTime !== undefined) {
      params.set("startTime", String(input.startTime));
    }

    if (input.endTime !== undefined) {
      params.set("endTime", String(input.endTime));
    }

    if (input.limit !== undefined) {
      params.set("limit", String(input.limit));
    }

    const response = await fetch(
      `${this.apiBaseUrl}/api/v1/klines?${params.toString()}`,
      {
        headers: { Accept: "application/json" },
      },
    );
    const payload = await parseResponseBody(response);

    if (!response.ok) {
      throw new PacificaApiError(
        `Pacifica candles request failed (${response.status}).`,
        {
          status: response.status,
          body: payload,
          retryable: response.status === 429 || response.status >= 500,
        },
      );
    }

    const data =
      payload && typeof payload === "object" && "data" in payload
        ? (payload as { data?: unknown }).data
        : payload;

    if (!Array.isArray(data)) {
      return [];
    }

    return data.flatMap((item) => {
      if (!item || typeof item !== "object") {
        return [];
      }

      const row = item as Record<string, unknown>;
      const openTime = Number(row.openTime ?? row.open_time ?? row.t);
      const closeTime = Number(row.closeTime ?? row.close_time ?? row.T);
      const open = Number(row.open ?? row.o);
      const high = Number(row.high ?? row.h);
      const low = Number(row.low ?? row.l);
      const close = Number(row.close ?? row.c);
      const volume = Number(row.volume ?? row.v ?? 0);

      if (
        !Number.isFinite(openTime) ||
        !Number.isFinite(closeTime) ||
        !Number.isFinite(open) ||
        !Number.isFinite(high) ||
        !Number.isFinite(low) ||
        !Number.isFinite(close)
      ) {
        return [];
      }

      return [
        {
          symbol: input.symbol,
          interval: input.interval,
          openTime,
          closeTime,
          open,
          high,
          low,
          close,
          volume,
        },
      ];
    });
  }

  private async requestSigned(input: {
    path: string;
    operationType: string;
    data: Record<string, unknown>;
  }) {
    const unsignedBody = this.buildUnsignedBody(input.data);
    const primarySigningPayload = {
      timestamp: unsignedBody.timestamp,
      expiry_window: unsignedBody.expiry_window,
      type: input.operationType,
      data: input.data,
    };

    let { response, payload } = await this.postSigned(
      input.path,
      unsignedBody,
      primarySigningPayload,
    );
    const signatureRejected =
      response.status === 400 &&
      typeof (payload as { raw?: unknown } | null)?.raw === "string" &&
      (() => {
        const rawMessage = String(
          (payload as { raw: string }).raw,
        ).toLowerCase();
        return (
          rawMessage.includes("verification failed") ||
          rawMessage.includes("invalid signature")
        );
      })();

    if (signatureRejected) {
      const fallbackSigningPayload = { ...unsignedBody };

      ({ response, payload } = await this.postSigned(
        input.path,
        unsignedBody,
        fallbackSigningPayload,
      ));
    }

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

  private buildUnsignedBody(data: Record<string, unknown>) {
    const includeAgentWallet = this.signerPublicKey === this.agentWallet;

    return {
      account: this.account,
      timestamp: Date.now(),
      expiry_window: this.expiryWindowMs,
      ...data,
      ...(includeAgentWallet ? { agent_wallet: this.agentWallet } : {}),
    };
  }

  private async postSigned(
    path: string,
    unsignedBody: Record<string, unknown>,
    signingPayload: Record<string, unknown>,
  ) {
    const signature = signPayload(this.signingKey, signingPayload);
    const requestBody = {
      ...unsignedBody,
      signature,
    };

    const response = await fetch(`${this.apiBaseUrl}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });
    const payload = await parseResponseBody(response);
    return { response, payload };
  }
}

// ---------------------------------------------------------------------------
// Exported helpers
// ---------------------------------------------------------------------------

export function findMarketInfo(
  payload: unknown,
  symbol: string,
): PacificaMarketInfo | null {
  const candidates = extractMarketInfoCandidates(payload);
  const normalizedSymbol = symbol.trim().toUpperCase();
  const match = candidates.find(
    (candidate) => candidate.symbol.toUpperCase() === normalizedSymbol,
  );

  return match ?? null;
}

export function normalizeMarketOrderInput(input: {
  symbol: string;
  referencePrice: number;
  tickSize: string;
  lotSize: string;
  minOrderSize: string;
  targetNotionalUsd: number;
}) {
  const price = input.referencePrice;
  const tickSize = Number(input.tickSize);
  const lotSize = Number(input.lotSize);
  const minOrderSize = Number(input.minOrderSize);

  if (
    !Number.isFinite(price) ||
    !Number.isFinite(tickSize) ||
    !Number.isFinite(lotSize) ||
    !Number.isFinite(minOrderSize) ||
    !Number.isFinite(input.targetNotionalUsd) ||
    price <= 0 ||
    tickSize <= 0 ||
    lotSize <= 0 ||
    minOrderSize <= 0 ||
    input.targetNotionalUsd <= 0
  ) {
    throw new Error("Market order input is invalid.");
  }

  const roundedReferencePrice = roundUpToMultiple(price, tickSize);
  const effectiveNotionalUsd = Math.max(minOrderSize, input.targetNotionalUsd);
  const minimumAmount = effectiveNotionalUsd / roundedReferencePrice;
  const roundedAmount = roundUpToMultiple(minimumAmount, lotSize);

  return {
    symbol: input.symbol,
    amount: formatDecimal(roundedAmount, input.lotSize),
    referencePrice: formatDecimal(roundedReferencePrice, input.tickSize),
    targetNotionalUsd: formatDecimal(effectiveNotionalUsd, "1"),
  };
}

export function calculateTargetPositionSizing(input: {
  availableBalance: number;
  positionSizeType: "fixed_amount" | "balance_percent";
  positionSizeValue: number;
  leverage: number;
}) {
  if (input.positionSizeType === "fixed_amount") {
    return {
      targetInitialMarginUsd: input.positionSizeValue / input.leverage,
      targetNotionalUsd: input.positionSizeValue,
    };
  }

  const targetInitialMarginUsd =
    input.availableBalance * (input.positionSizeValue / 100);

  return {
    targetInitialMarginUsd,
    targetNotionalUsd: targetInitialMarginUsd * input.leverage,
  };
}

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

function extractMarketInfoCandidates(payload: unknown): PacificaMarketInfo[] {
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
    const symbol = String(
      candidate.symbol ?? candidate.name ?? "",
    ).trim();
    const tickSize = String(
      candidate.tick_size ?? candidate.tickSize ?? "",
    ).trim();
    const lotSize = String(
      candidate.lot_size ?? candidate.lotSize ?? "",
    ).trim();
    const minOrderSize = String(
      candidate.min_order_size ?? candidate.minOrderSize ?? "",
    ).trim();

    if (!symbol || !tickSize || !lotSize || !minOrderSize) {
      return [];
    }

    return [{ symbol, tickSize, lotSize, minOrderSize }];
  });
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

function cleanBaseUrl(rawBaseUrl: string) {
  return rawBaseUrl.trim().replace(/\/+$/, "");
}

function normalizeAddress(rawAddress: string) {
  const normalized = rawAddress.trim();

  if (!normalized) {
    throw new Error("Pacifica address cannot be empty.");
  }

  return normalized;
}

function normalizeOptionalString(rawValue: string | null | undefined) {
  const normalized = String(rawValue ?? "").trim();
  return normalized ? normalized : null;
}

function normalizePositionSide(
  sideValue: unknown,
  positionSideValue: unknown,
  amountValue: unknown,
): "bid" | "ask" | null {
  const directSide = String(sideValue ?? positionSideValue ?? "")
    .trim()
    .toLowerCase();

  if (directSide === "bid" || directSide === "long") {
    return "bid";
  }

  if (directSide === "ask" || directSide === "short") {
    return "ask";
  }

  const amount = Number(amountValue);

  if (Number.isFinite(amount) && amount !== 0) {
    return amount > 0 ? "bid" : "ask";
  }

  return null;
}

function normalizePositionAmount(amountValue: unknown) {
  const amount = Number(amountValue);

  if (!Number.isFinite(amount) || amount === 0) {
    return null;
  }

  return String(Math.abs(amount));
}

function normalizePositionEntryPrice(value: unknown) {
  const price = Number(value);

  if (!Number.isFinite(price) || price <= 0) {
    return null;
  }

  return String(price);
}

async function parseResponseBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? "";
  const raw = await response.text();

  if (contentType.includes("application/json")) {
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw);
    } catch {
      return { raw };
    }
  }

  return raw ? { raw } : null;
}
