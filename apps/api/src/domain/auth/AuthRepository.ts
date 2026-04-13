export interface AuthRepository {
  createNonce(input: {
    walletAddress: string;
    nonce: string;
    expiresAt: Date;
  }): Promise<void>;

  consumeNonce(input: {
    nonce: string;
    walletAddress: string;
  }): Promise<{ valid: boolean }>;
}
