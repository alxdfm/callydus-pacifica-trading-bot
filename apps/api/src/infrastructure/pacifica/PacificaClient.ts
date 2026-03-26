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
  expiryWindowMs: number;
};

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

export class PacificaClient {
  private readonly apiBaseUrl: string;
  private readonly account: string;
  private readonly agentWallet: string;
  private readonly expiryWindowMs: number;
  private readonly signingKey: KeyObject;
  private readonly signerPublicKey: string;

  constructor(input: PacificaClientInput) {
    this.apiBaseUrl = cleanBaseUrl(input.apiBaseUrl);
    this.account = normalizeAddress(input.account);
    this.agentWallet = normalizeAddress(input.agentWallet);
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

  async approveBuilderCode(input: {
    builderCode: string;
    maxFeeRate: string;
  }): Promise<unknown> {
    return this.requestSigned({
      path: "/api/v1/account/builder_codes/approve",
      operationType: "approve_builder_code",
      data: {
        builder_code: input.builderCode,
        max_fee_rate: input.maxFeeRate,
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
      "primary",
    );

    const verificationFailed =
      response.status === 400 &&
      typeof (payload as { raw?: unknown } | null)?.raw === "string" &&
      String((payload as { raw: string }).raw)
        .toLowerCase()
        .includes("verification failed");

    if (verificationFailed) {
      logPacificaSignatureAttempt("Primary signature verification failed. Retrying with unsignedBody.", {
        path: input.path,
        operationType: input.operationType,
        account: this.account,
        agentWallet: this.agentWallet,
        signerPublicKey: this.signerPublicKey,
        includesAgentWallet: "agent_wallet" in unsignedBody,
        firstResponseStatus: response.status,
        firstResponseBody: payload,
      });

      ({ response, payload } = await this.postSigned(
        input.path,
        unsignedBody,
        { ...unsignedBody },
        "fallback",
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
    attempt: "primary" | "fallback",
  ) {
    const signature = signPayload(this.signingKey, signingPayload);
    const response = await fetch(`${this.apiBaseUrl}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...unsignedBody,
        signature,
      }),
    });
    const payload = await parseResponseBody(response);

    logPacificaSignatureAttempt("Pacifica signed request executed.", {
      attempt,
      path,
      account: this.account,
      agentWallet: this.agentWallet,
      signerPublicKey: this.signerPublicKey,
      includesAgentWallet: "agent_wallet" in unsignedBody,
      responseStatus: response.status,
      responseBody: payload,
    });

    return { response, payload };
  }
}

function logPacificaSignatureAttempt(
  message: string,
  context: {
    attempt?: "primary" | "fallback";
    path: string;
    operationType?: string;
    account: string;
    agentWallet: string;
    signerPublicKey: string;
    includesAgentWallet: boolean;
    responseStatus?: number;
    responseBody?: unknown;
    firstResponseStatus?: number;
    firstResponseBody?: unknown;
  },
) {
  console.info("[pacifica-signature]", {
    message,
    attempt: context.attempt,
    path: context.path,
    operationType: context.operationType,
    account: shortenPublicKey(context.account),
    agentWallet: shortenPublicKey(context.agentWallet),
    signerPublicKey: shortenPublicKey(context.signerPublicKey),
    includesAgentWallet: context.includesAgentWallet,
    responseStatus: context.responseStatus,
    responseBody: context.responseBody,
    firstResponseStatus: context.firstResponseStatus,
    firstResponseBody: context.firstResponseBody,
  });
}

function shortenPublicKey(value: string) {
  const normalized = value.trim();

  if (normalized.length <= 10) {
    return normalized;
  }

  return `${normalized.slice(0, 4)}...${normalized.slice(-4)}`;
}

function cleanBaseUrl(value: string): string {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

function normalizeAddress(value: string): string {
  return value.trim();
}

function parsePrivateKey(rawValue: string): Buffer {
  const trimmed = rawValue.trim();

  if (trimmed.startsWith("[")) {
    return Buffer.from(JSON.parse(trimmed) as number[]);
  }

  return decodeBase58(trimmed);
}

function decodeBase58(input: string): Buffer {
  let value = 0n;

  for (const char of input) {
    const digit = BASE58_MAP.get(char);

    if (digit === undefined) {
      throw new Error("Invalid base58 string.");
    }

    value = value * 58n + BigInt(digit);
  }

  const bytes: number[] = [];

  while (value > 0n) {
    bytes.unshift(Number(value % 256n));
    value /= 256n;
  }

  for (let index = 0; index < input.length && input[index] === "1"; index += 1) {
    bytes.unshift(0);
  }

  return Buffer.from(bytes);
}

function encodeBase58(input: Buffer): string {
  let value = 0n;

  for (const byte of input) {
    value = value * 256n + BigInt(byte);
  }

  let encoded = "";

  while (value > 0n) {
    const modulo = Number(value % 58n);
    encoded = BASE58_ALPHABET[modulo] + encoded;
    value /= 58n;
  }

  for (let index = 0; index < input.length && input[index] === 0; index += 1) {
    encoded = `1${encoded}`;
  }

  return encoded || "1";
}

function derivePublicKeyBase58(signingKey: KeyObject): string {
  const publicKey = createPublicKey(signingKey);
  const spki = publicKey.export({
    format: "der",
    type: "spki",
  });

  if (!Buffer.isBuffer(spki)) {
    throw new Error("Unable to derive Pacifica public key from private key.");
  }

  const raw = spki.subarray(
    ED25519_SPKI_PREFIX.length,
    ED25519_SPKI_PREFIX.length + 32,
  );

  return encodeBase58(raw);
}

function signPayload(signingKey: KeyObject, payload: unknown): string {
  const compactPayload = JSON.stringify(sortKeysDeep(payload));
  const signature = sign(null, Buffer.from(compactPayload, "utf8"), signingKey);
  return encodeBase58(signature);
}

function sortKeysDeep(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortKeysDeep);
  }

  if (value && typeof value === "object") {
    return Object.keys(value)
      .sort()
      .reduce<Record<string, unknown>>((accumulator, key) => {
        accumulator[key] = sortKeysDeep(
          (value as Record<string, unknown>)[key],
        );
        return accumulator;
      }, {});
  }

  return value;
}

async function parseResponseBody(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return response.json().catch(() => null);
  }

  const raw = await response.text().catch(() => "");
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return { raw };
  }
}
