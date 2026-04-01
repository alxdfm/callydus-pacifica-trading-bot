import { serializePacificaSigningPayload } from "@pacifica/contracts";
import {
  createPrivateKey,
  createPublicKey,
  sign,
  type KeyObject,
} from "node:crypto";

const BASE58_ALPHABET =
  "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
const BASE58_MAP = new Map(
  [...BASE58_ALPHABET].map((char, index) => [char, index]),
);
const ED25519_PKCS8_PREFIX = Buffer.from(
  "302e020100300506032b657004220420",
  "hex",
);
const ED25519_SPKI_PREFIX = Buffer.from("302a300506032b6570032100", "hex");

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

    const rawPrivateKey = parsePrivateKey(input.privateKey);
    const seed = rawPrivateKey.length === 64 ? rawPrivateKey.subarray(0, 32) : rawPrivateKey;

    if (seed.length !== 32) {
      throw new Error(
        "Pacifica private key must decode to 32-byte seed or 64-byte keypair.",
      );
    }

    this.signingKey = createPrivateKey({
      key: Buffer.concat([ED25519_PKCS8_PREFIX, seed]),
      format: "der",
      type: "pkcs8",
    });
    this.signerPublicKey = derivePublicKeyBase58(this.signingKey);

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
    takeProfit?: {
      stopPrice: string;
      limitPrice?: string;
      clientOrderId?: string;
    };
    stopLoss?: {
      stopPrice: string;
      limitPrice?: string;
      clientOrderId?: string;
    };
  }): Promise<unknown> {
    return this.requestSigned({
      path: "/api/v1/orders/create_market",
      operationType: "create_market_order",
      data: {
        symbol: input.symbol,
        side: input.side,
        amount: input.amount,
        slippage_percent: input.slippagePercent,
        reduce_only: false,
        client_order_id: input.clientOrderId,
        ...(this.builderCode ? { builder_code: this.builderCode } : {}),
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
      },
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
        const rawMessage = String((payload as { raw: string }).raw).toLowerCase();
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

export function findMarketInfo(payload: unknown, symbol: string): PacificaMarketInfo | null {
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

export function deriveSignerPublicKeyFromPrivateKey(rawPrivateKey: string): string {
  const decodedPrivateKey = parsePrivateKey(rawPrivateKey);
  const seed =
    decodedPrivateKey.length === 64
      ? decodedPrivateKey.subarray(0, 32)
      : decodedPrivateKey;

  if (seed.length !== 32) {
    throw new Error(
      "Pacifica private key must decode to 32-byte seed or 64-byte keypair.",
    );
  }

  const signingKey = createPrivateKey({
    key: Buffer.concat([ED25519_PKCS8_PREFIX, seed]),
    format: "der",
    type: "pkcs8",
  });

  return derivePublicKeyBase58(signingKey);
}

function derivePublicKeyBase58(signingKey: KeyObject) {
  const publicKeyDer = createPublicKey(signingKey).export({
    format: "der",
    type: "spki",
  });

  const publicKeyBytes = Buffer.from(publicKeyDer).subarray(
    ED25519_SPKI_PREFIX.length,
  );
  return encodeBase58(publicKeyBytes);
}

function signPayload(signingKey: KeyObject, payload: Record<string, unknown>) {
  const signatureBytes = sign(
    null,
    Buffer.from(serializePacificaSigningPayload(payload)),
    signingKey,
  );
  return encodeBase58(signatureBytes);
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

function parsePrivateKey(rawPrivateKey: string) {
  const normalized = rawPrivateKey.trim();

  if (!normalized) {
    throw new Error("Pacifica private key cannot be empty.");
  }

  return decodeBase58(normalized);
}

function decodeBase58(value: string) {
  let digits = [0];

  for (const character of value) {
    const currentValue = BASE58_MAP.get(character);

    if (currentValue === undefined) {
      throw new Error(`Invalid base58 character: ${character}`);
    }

    let carry = currentValue;

    for (let index = 0; index < digits.length; index += 1) {
      const next = (digits[index] ?? 0) * 58 + carry;
      digits[index] = next & 0xff;
      carry = next >> 8;
    }

    while (carry > 0) {
      digits.push(carry & 0xff);
      carry >>= 8;
    }
  }

  for (const character of value) {
    if (character !== "1") {
      break;
    }

    digits.push(0);
  }

  return Buffer.from(digits.reverse());
}

function encodeBase58(buffer: Uint8Array) {
  if (buffer.length === 0) {
    return "";
  }

  const digits = [0];

  for (const byte of buffer) {
    let carry = byte;

    for (let index = 0; index < digits.length; index += 1) {
      const next = (digits[index] ?? 0) * 256 + carry;
      digits[index] = next % 58;
      carry = Math.floor(next / 58);
    }

    while (carry > 0) {
      digits.push(carry % 58);
      carry = Math.floor(carry / 58);
    }
  }

  let encoded = "";

  for (const byte of buffer) {
    if (byte !== 0) {
      break;
    }

    encoded += "1";
  }

  for (let index = digits.length - 1; index >= 0; index -= 1) {
    const digit = digits[index];
    encoded += typeof digit === "number" ? (BASE58_ALPHABET[digit] ?? "") : "";
  }

  return encoded;
}

async function parseResponseBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  const raw = await response.text();
  return raw ? { raw } : null;
}
