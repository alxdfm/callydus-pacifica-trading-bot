import { describe, expect, it, vi } from "vitest";
import { createVerifyPacificaOperational } from "./VerifyPacificaOperational";

describe("createVerifyPacificaOperational", () => {
  it("falha quando a credencial não existe", async () => {
    const verify = createVerifyPacificaOperational({
      credentialRepository: {
        findById: vi.fn().mockResolvedValue(null),
      } as never,
      credentialEncryption: {} as never,
      operationalVerification: {} as never,
    });

    await expect(verify({ credentialId: "credential-1", walletAddress: "wallet-1" })).resolves.toEqual({
      ok: false,
      operationalVerificationStatus: "error",
      errorCode: "credential_not_found",
    });
  });

  it("bloqueia verificação operacional para credencial ainda não validada", async () => {
    const verify = createVerifyPacificaOperational({
      credentialRepository: {
        findById: vi.fn().mockResolvedValue({
          id: "credential-1",
          validationStatus: "invalid",
        }),
      } as never,
      credentialEncryption: {} as never,
      operationalVerification: {} as never,
    });

    await expect(verify({ credentialId: "credential-1", walletAddress: "wallet-1" })).resolves.toEqual({
      ok: false,
      operationalVerificationStatus: "blocked",
      errorCode: "credential_not_valid",
    });
  });

  it("reaproveita verificação operacional já concluída", async () => {
    const appendOperationalEvent = vi.fn();
    const verify = createVerifyPacificaOperational({
      credentialRepository: {
        findById: vi.fn().mockResolvedValue({
          id: "credential-1",
          walletAddress: "wallet-1",
          validationStatus: "valid",
          operationallyVerified: true,
          lastOperationalVerifiedAt: "2026-04-01T00:00:00.000Z",
          lastOperationalProbeJson: {
            symbol: "BTC",
            clientOrderId: "ecb1375e-b68d-4f1d-b443-e3fb17ac9de2",
          },
        }),
      } as never,
      credentialEncryption: {} as never,
      operationalVerification: {} as never,
      eventRepository: {
        appendOperationalEvent,
      } as never,
    });

    const result = await verify({ credentialId: "credential-1", walletAddress: "wallet-1" });

    expect(result).toEqual({
      ok: true,
      credentialId: "credential-1",
      operationalVerificationStatus: "verified",
      verifiedAt: "2026-04-01T00:00:00.000Z",
      probeSymbol: "BTC",
      probeClientOrderId: "ecb1375e-b68d-4f1d-b443-e3fb17ac9de2",
    });
    expect(appendOperationalEvent).toHaveBeenCalledTimes(1);
  });

  it("persiste falhas bloqueantes e transitórias com o bucket correto", async () => {
    const updateOperationalVerification = vi.fn();
    const verify = createVerifyPacificaOperational({
      credentialRepository: {
        findById: vi.fn().mockResolvedValue({
          id: "credential-1",
          walletAddress: "wallet-1",
          publicKey: "agent-1",
          encryptedPrivateKeyRef: "enc-ref-1",
          validationStatus: "valid",
          operationallyVerified: false,
          lastOperationalVerifiedAt: null,
        }),
        updateOperationalVerification,
      } as never,
      credentialEncryption: {
        decryptAgentWalletPrivateKey: vi.fn().mockResolvedValue("secret-key"),
      } as never,
      operationalVerification: {
        verifyOperationalReadiness: vi.fn().mockResolvedValue({
          ok: false,
          errorCode: "rate_limited",
          probePayload: { symbol: "BTC" },
        }),
      } as never,
    });

    const result = await verify({ credentialId: "credential-1", walletAddress: "wallet-1" });

    expect(result).toEqual({
      ok: false,
      operationalVerificationStatus: "error",
      errorCode: "rate_limited",
    });
    expect(updateOperationalVerification).toHaveBeenCalledWith({
      credentialId: "credential-1",
      operationallyVerified: false,
      lastOperationalVerifiedAt: null,
      lastOperationalErrorCode: "rate_limited",
      lastOperationalProbeJson: { symbol: "BTC" },
    });
  });

  it("persiste sucesso operacional e promove a credencial para verified", async () => {
    const updateOperationalVerification = vi.fn();
    const verify = createVerifyPacificaOperational({
      credentialRepository: {
        findById: vi.fn().mockResolvedValue({
          id: "credential-1",
          walletAddress: "wallet-1",
          publicKey: "agent-1",
          encryptedPrivateKeyRef: "enc-ref-1",
          validationStatus: "valid",
          operationallyVerified: false,
          lastOperationalVerifiedAt: null,
        }),
        updateOperationalVerification,
      } as never,
      credentialEncryption: {
        decryptAgentWalletPrivateKey: vi.fn().mockResolvedValue("secret-key"),
      } as never,
      operationalVerification: {
        verifyOperationalReadiness: vi.fn().mockResolvedValue({
          ok: true,
          verifiedAt: "2026-04-01T04:00:00.000Z",
          probeSymbol: "BTC",
          probeClientOrderId: "9f5d0bbf-53d4-4b9b-936a-db750bf31fc7",
          probePayload: { symbol: "BTC" },
        }),
      } as never,
    });

    const result = await verify({ credentialId: "credential-1", walletAddress: "wallet-1" });

    expect(result.ok).toBe(true);
    expect(updateOperationalVerification).toHaveBeenCalledWith({
      credentialId: "credential-1",
      operationallyVerified: true,
      lastOperationalVerifiedAt: "2026-04-01T04:00:00.000Z",
      lastOperationalErrorCode: null,
      lastOperationalProbeJson: { symbol: "BTC" },
    });
  });
});
