import { describe, expect, it, vi } from "vitest";
import { createLookupOperationalAccountByWallet } from "./LookupOperationalAccountByWallet";

describe("createLookupOperationalAccountByWallet", () => {
  it("retorna not found quando a wallet não tem conta operacional", async () => {
    const lookup = createLookupOperationalAccountByWallet({
      credentialRepository: {
        findOperationalAccountByWalletAddress: vi.fn().mockResolvedValue(null),
      } as never,
    });

    await expect(lookup({ walletAddress: "wallet-1" })).resolves.toEqual({
      ok: true,
      accountExists: false,
      walletAddress: "wallet-1",
    });
  });

  it("expõe apenas o metadata mínimo de onboarding", async () => {
    const lookup = createLookupOperationalAccountByWallet({
      credentialRepository: {
        findOperationalAccountByWalletAddress: vi.fn().mockResolvedValue({
          walletAddress: "wallet-1",
          onboardingStatus: "ready",
          credentialId: "credential-1",
          credentialAlias: "Main",
          agentWalletPublicKey: "agent-1",
          keyFingerprint: "fingerprint-1",
          operationallyVerified: true,
        }),
      } as never,
    });

    await expect(lookup({ walletAddress: "wallet-1" })).resolves.toEqual({
      ok: true,
      accountExists: true,
      walletAddress: "wallet-1",
      onboardingStatus: "ready",
      credentialId: "credential-1",
      credentialAlias: "Main",
      agentWalletPublicKey: "agent-1",
      keyFingerprint: "fingerprint-1",
      operationallyVerified: true,
    });
  });
});
