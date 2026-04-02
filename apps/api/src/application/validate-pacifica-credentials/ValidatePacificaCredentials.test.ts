import { describe, expect, it, vi } from "vitest";
import { createValidatePacificaCredentials } from "./ValidatePacificaCredentials";

const input = {
  mainWalletPublicKey: "wallet-1",
  agentWalletPublicKey: "agent-1",
  agentWalletPrivateKey: " secret-key ",
  credentialAlias: "Primary agent",
};

describe("createValidatePacificaCredentials", () => {
  it("reaproveita credencial equivalente já validada", async () => {
    const appendOperationalEvent = vi.fn();
    const validate = createValidatePacificaCredentials({
      credentialRepository: {
        findActiveCredential: vi.fn().mockResolvedValue({
          id: "credential-1",
          keyFingerprint: "fingerprint-1",
          validationStatus: "valid",
          lastValidatedAt: "2026-04-01T00:00:00.000Z",
        }),
        findLatestCredentialByWalletAndPublicKey: vi.fn(),
        save: vi.fn(),
      } as never,
      credentialEncryption: {
        encryptAgentWalletPrivateKey: vi.fn().mockResolvedValue({
          encryptedPrivateKeyRef: "enc-ref-1",
          keyFingerprint: "fingerprint-1",
        }),
        decryptAgentWalletPrivateKey: vi.fn(),
      } as never,
      credentialValidation: {
        validateAgentWallet: vi.fn(),
      } as never,
      createCredentialId: () => "new-id",
      eventRepository: {
        appendOperationalEvent,
      } as never,
    });

    const result = await validate(input);

    expect(result).toEqual({
      ok: true,
      credentialId: "credential-1",
      keyFingerprint: "fingerprint-1",
      validationStatus: "valid",
      validatedAt: "2026-04-01T00:00:00.000Z",
      reusedExistingCredential: true,
    });
    expect(appendOperationalEvent).toHaveBeenCalledTimes(1);
  });

  it("reaproveita a última credencial validada quando o segredo decriptado coincide", async () => {
    const decryptAgentWalletPrivateKey = vi
      .fn()
      .mockResolvedValue("secret-key");
    const validateAgentWallet = vi.fn();
    const save = vi.fn();
    const validate = createValidatePacificaCredentials({
      credentialRepository: {
        findActiveCredential: vi.fn().mockResolvedValue(null),
        findLatestCredentialByWalletAndPublicKey: vi.fn().mockResolvedValue({
          id: "credential-2",
          keyFingerprint: "fingerprint-2",
          validationStatus: "valid",
          encryptedPrivateKeyRef: "enc-ref-2",
          lastValidatedAt: "2026-04-01T01:00:00.000Z",
        }),
        save,
      } as never,
      credentialEncryption: {
        encryptAgentWalletPrivateKey: vi.fn().mockResolvedValue({
          encryptedPrivateKeyRef: "enc-ref-1",
          keyFingerprint: "fingerprint-1",
        }),
        decryptAgentWalletPrivateKey,
      } as never,
      credentialValidation: {
        validateAgentWallet,
      } as never,
      createCredentialId: () => "new-id",
    });

    const result = await validate(input);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.reusedExistingCredential).toBe(true);
    }
    expect(validateAgentWallet).not.toHaveBeenCalled();
    expect(save).not.toHaveBeenCalled();
  });

  it("mapeia falhas transitórias da Pacifica como status error", async () => {
    const appendOperationalEvent = vi.fn();
    const validate = createValidatePacificaCredentials({
      credentialRepository: {
        findActiveCredential: vi.fn().mockResolvedValue(null),
        findLatestCredentialByWalletAndPublicKey: vi.fn().mockResolvedValue(null),
        save: vi.fn(),
      } as never,
      credentialEncryption: {
        encryptAgentWalletPrivateKey: vi.fn().mockResolvedValue({
          encryptedPrivateKeyRef: "enc-ref-1",
          keyFingerprint: "fingerprint-1",
        }),
      } as never,
      credentialValidation: {
        validateAgentWallet: vi.fn().mockResolvedValue({
          ok: false,
          errorCode: "provider_unavailable",
        }),
      } as never,
      createCredentialId: () => "new-id",
      eventRepository: {
        appendOperationalEvent,
      } as never,
    });

    const result = await validate(input);

    expect(result).toEqual({
      ok: false,
      validationStatus: "error",
      errorCode: "provider_unavailable",
    });
    expect(appendOperationalEvent).toHaveBeenCalledTimes(1);
  });

  it("persiste nova credencial validada como pending até a verificação operacional", async () => {
    const save = vi.fn().mockResolvedValue({
      id: "credential-3",
      keyFingerprint: "fingerprint-3",
    });
    const validate = createValidatePacificaCredentials({
      credentialRepository: {
        findActiveCredential: vi.fn().mockResolvedValue(null),
        findLatestCredentialByWalletAndPublicKey: vi.fn().mockResolvedValue(null),
        save,
      } as never,
      credentialEncryption: {
        encryptAgentWalletPrivateKey: vi.fn().mockResolvedValue({
          encryptedPrivateKeyRef: "enc-ref-3",
          keyFingerprint: "fingerprint-3",
        }),
      } as never,
      credentialValidation: {
        validateAgentWallet: vi.fn().mockResolvedValue({
          ok: true,
          validatedAt: "2026-04-01T02:00:00.000Z",
        }),
      } as never,
      createCredentialId: () => "credential-3",
    });

    const result = await validate(input);

    expect(result).toEqual({
      ok: true,
      credentialId: "credential-3",
      keyFingerprint: "fingerprint-3",
      validationStatus: "valid",
      validatedAt: "2026-04-01T02:00:00.000Z",
      reusedExistingCredential: false,
    });
    expect(save.mock.calls[0]?.[0]).toMatchObject({
      lifecycleStatus: "pending",
      operationallyVerified: false,
      lastOperationalVerifiedAt: null,
      lastOperationalErrorCode: null,
    });
  });
});
