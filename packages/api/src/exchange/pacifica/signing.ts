import {
  createPrivateKey,
  createPublicKey,
  sign,
  type KeyObject,
} from "node:crypto";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Serialization
// ---------------------------------------------------------------------------

function sortKeysDeep(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => sortKeysDeep(item));
  }

  if (value && typeof value === "object") {
    return Object.keys(value as Record<string, unknown>)
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

export function serializePacificaSigningPayload(
  payload: Record<string, unknown>,
): string {
  return JSON.stringify(sortKeysDeep(payload));
}

// ---------------------------------------------------------------------------
// Key operations
// ---------------------------------------------------------------------------

export function parsePrivateKey(rawPrivateKey: string): Buffer {
  const normalized = rawPrivateKey.trim();

  if (!normalized) {
    throw new Error("Pacifica private key cannot be empty.");
  }

  return decodeBase58(normalized);
}

export function derivePublicKeyBase58(signingKey: KeyObject): string {
  const publicKeyDer = createPublicKey(signingKey).export({
    format: "der",
    type: "spki",
  });

  const publicKeyBytes = Buffer.from(publicKeyDer).subarray(
    ED25519_SPKI_PREFIX.length,
  );
  return encodeBase58(publicKeyBytes);
}

export function signPayload(
  signingKey: KeyObject,
  payload: Record<string, unknown>,
): string {
  const signatureBytes = sign(
    null,
    Buffer.from(serializePacificaSigningPayload(payload)),
    signingKey,
  );
  return encodeBase58(signatureBytes);
}

export function buildSigningKeyFromPrivateKey(privateKeyBase58: string): {
  signingKey: KeyObject;
  publicKeyBase58: string;
} {
  const rawPrivateKey = parsePrivateKey(privateKeyBase58);
  const seed =
    rawPrivateKey.length === 64
      ? rawPrivateKey.subarray(0, 32)
      : rawPrivateKey;

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
  const publicKeyBase58 = derivePublicKeyBase58(signingKey);

  return { signingKey, publicKeyBase58 };
}

// ---------------------------------------------------------------------------
// Base58 encoding / decoding
// ---------------------------------------------------------------------------

export function decodeBase58(value: string): Buffer {
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

export function encodeBase58(buffer: Uint8Array): string {
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
    encoded +=
      typeof digit === "number" ? (BASE58_ALPHABET[digit] ?? "") : "";
  }

  return encoded;
}
