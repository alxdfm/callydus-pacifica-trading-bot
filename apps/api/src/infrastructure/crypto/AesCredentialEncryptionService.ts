import {
  createCipheriv,
  createHash,
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
        .update(normalizedPublicKey)
        .digest("hex"),
    };
  }
}
