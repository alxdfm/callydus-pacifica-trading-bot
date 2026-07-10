import { createDecipheriv, createHash, hkdfSync } from "node:crypto";

// Porta somente o caminho de DECRYPT do serviço da API
// (packages/api/src/crypto/credential-encryption.ts) — o worker nunca criptografa
export class AesCredentialDecryptionService {
  constructor(private readonly encryptionKey: string) {}

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

function deriveKey(encryptionKey: string, keyId: string): Buffer {
  if (keyId.startsWith("v2")) {
    const salt = Buffer.from(`pacifica-credential:${keyId}`, "utf8");
    return Buffer.from(
      hkdfSync("sha256", encryptionKey, salt, "aes-256-gcm-key", 32),
    );
  }

  return createHash("sha256").update(encryptionKey).digest();
}
