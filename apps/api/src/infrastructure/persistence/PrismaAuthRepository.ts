import type { PrismaClient } from "@prisma/client";
import type { AuthRepository } from "../../domain/auth/AuthRepository";

export class PrismaAuthRepository implements AuthRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async createNonce(input: {
    walletAddress: string;
    nonce: string;
    expiresAt: Date;
  }): Promise<void> {
    // Lazy cleanup: remove expired nonces before inserting a new one.
    // This avoids unbounded table growth without requiring a background job,
    // which is important for the Lambda (stateless) deployment model.
    await this.prisma.authNonce.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });

    await this.prisma.authNonce.create({
      data: {
        walletAddress: input.walletAddress,
        nonce: input.nonce,
        expiresAt: input.expiresAt,
      },
    });
  }

  async consumeNonce(input: {
    nonce: string;
    walletAddress: string;
  }): Promise<{ valid: boolean }> {
    // Atomic check-and-mark: only succeeds if the nonce exists, belongs to the
    // wallet, has not been used, and has not expired. Uses updateMany so that
    // concurrent calls cannot both succeed (only one will find usedAt IS NULL).
    const result = await this.prisma.authNonce.updateMany({
      where: {
        nonce: input.nonce,
        walletAddress: input.walletAddress,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      data: { usedAt: new Date() },
    });

    return { valid: result.count > 0 };
  }
}
