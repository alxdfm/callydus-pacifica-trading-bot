import {
  createCipheriv,
  createHash,
  createDecipheriv,
  randomBytes,
} from "node:crypto";
import type {
  CredentialEncryptionPort,
  EncryptedCredentialSecret,
} from "../../domain/pacifica-credentials/CredentialEncryptionPort";

export class AesCredentialEncryptionService implements CredentialEncryptionPort {
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
    const key = createHash("sha256").update(this.encryptionKey).digest();
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
    const key = createHash("sha256").update(this.encryptionKey).digest();
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
