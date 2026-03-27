export type EncryptedCredentialSecret = {
  encryptedPrivateKeyRef: string;
  keyFingerprint: string;
};

export interface CredentialEncryptionPort {
  encryptAgentWalletPrivateKey(input: {
    agentWalletPublicKey: string;
    agentWalletPrivateKey: string;
  }): Promise<EncryptedCredentialSecret>;
  decryptAgentWalletPrivateKey(input: {
    encryptedPrivateKeyRef: string;
  }): Promise<string>;
}
