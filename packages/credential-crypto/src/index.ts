import {
  createCipheriv,
  createDecipheriv,
  createHash,
  hkdfSync,
  randomBytes,
} from "node:crypto";

export type EncryptedCredentialSecret = {
  encryptedPrivateKeyRef: string;
  keyFingerprint: string;
};

export class AesCredentialEncryptionService {
  constructor(
    private readonly encryptionKey: string,
    private readonly keyId: string,
  ) {}

  async encryptAgentWalletPrivateKey(input: {
    agentWalletPublicKey: string;
    agentWalletPrivateKey: string;
  }): Promise<EncryptedCredentialSecret> {
    const normalizedPrivateKey = input.agentWalletPrivateKey.trim();
    const normalizedPublicKey = input.agentWalletPublicKey.trim();
    const iv = randomBytes(12);
    const key = deriveKey(this.encryptionKey, this.keyId);
    const cipher = createCipheriv("aes-256-gcm", key, iv);
    const ciphertext = Buffer.concat([
      cipher.update(normalizedPrivateKey, "utf8"),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();

    return {
      encryptedPrivateKeyRef: JSON.stringify({
        keyId: this.keyId,
        iv: iv.toString("base64"),
        authTag: authTag.toString("base64"),
        ciphertext: ciphertext.toString("base64"),
      }),
      keyFingerprint: createHash("sha256")
        .update(`${normalizedPublicKey}:${normalizedPrivateKey}`)
        .digest("hex"),
    };
  }

  async decryptAgentWalletPrivateKey(input: {
    encryptedPrivateKeyRef: string;
  }): Promise<string> {
    const parsed = JSON.parse(input.encryptedPrivateKeyRef) as {
      keyId: string;
      iv: string;
      authTag: string;
      ciphertext: string;
    };
    const key = deriveKey(this.encryptionKey, parsed.keyId);
    const decipher = createDecipheriv(
      "aes-256-gcm",
      key,
      Buffer.from(parsed.iv, "base64"),
    );

    decipher.setAuthTag(Buffer.from(parsed.authTag, "base64"));

    const plaintext = Buffer.concat([
      decipher.update(Buffer.from(parsed.ciphertext, "base64")),
      decipher.final(),
    ]);

    return plaintext.toString("utf8");
  }
}

/**
 * Derives a 256-bit AES key from the encryption key and keyId.
 *
 * Key IDs starting with "v2" use HKDF (SHA-256) with a deterministic salt
 * derived from the keyId, providing proper domain separation between key
 * versions.
 *
 * All other key IDs (e.g. "local-dev-v1") fall back to the original SHA-256
 * derivation for backwards compatibility with credentials encrypted before
 * the HKDF migration. Set CREDENTIAL_ENCRYPTION_KEY_ID to a value starting
 * with "v2" (e.g. "v2-prod") to use HKDF for new encryptions.
 */
function deriveKey(encryptionKey: string, keyId: string): Buffer {
  if (keyId.startsWith("v2")) {
    const salt = Buffer.from(`pacifica-credential:${keyId}`, "utf8");
    return Buffer.from(
      hkdfSync("sha256", encryptionKey, salt, "aes-256-gcm-key", 32),
    );
  }

  return createHash("sha256").update(encryptionKey).digest();
}
