import type { CredentialEncryptionPort } from "../../domain/pacifica-credentials/CredentialEncryptionPort";
import type { PacificaCredentialRepository } from "../../domain/pacifica-credentials/PacificaCredentialRepository";
import type {
  PacificaCredentialValidationErrorCode,
  PacificaCredentialValidationPort,
} from "../../domain/pacifica-credentials/PacificaCredentialValidationPort";

export type ValidatePacificaCredentialsInput = {
  mainWalletPublicKey: string;
  agentWalletPublicKey: string;
  agentWalletPrivateKey: string;
};

export type ValidatePacificaCredentialsOutput =
  | {
      ok: true;
      credentialId: string;
      keyFingerprint: string;
      validationStatus: "valid";
      validatedAt: string;
      reusedExistingCredential: boolean;
    }
  | {
      ok: false;
      validationStatus: "invalid" | "error";
      errorCode: PacificaCredentialValidationErrorCode;
    };

export type ValidatePacificaCredentialsDependencies = {
  credentialRepository: PacificaCredentialRepository;
  credentialEncryption: CredentialEncryptionPort;
  credentialValidation: PacificaCredentialValidationPort;
  createCredentialId: () => string;
};

export function createValidatePacificaCredentials(
  dependencies: ValidatePacificaCredentialsDependencies,
) {
  return async function validatePacificaCredentials(
    input: ValidatePacificaCredentialsInput,
  ): Promise<ValidatePacificaCredentialsOutput> {
    const encryptedSecret =
      await dependencies.credentialEncryption.encryptAgentWalletPrivateKey({
        agentWalletPublicKey: input.agentWalletPublicKey,
        agentWalletPrivateKey: input.agentWalletPrivateKey,
      });

    const existingCredential =
      await dependencies.credentialRepository.findActiveCredential({
        walletAddress: input.mainWalletPublicKey,
        publicKey: input.agentWalletPublicKey,
        keyFingerprint: encryptedSecret.keyFingerprint,
      });

    if (existingCredential?.validationStatus === "valid") {
      return {
        ok: true,
        credentialId: existingCredential.id,
        keyFingerprint: existingCredential.keyFingerprint,
        validationStatus: "valid",
        validatedAt:
          existingCredential.lastValidatedAt ?? new Date().toISOString(),
        reusedExistingCredential: true,
      };
    }

    const validationResult =
      await dependencies.credentialValidation.validateAgentWallet({
        mainWalletPublicKey: input.mainWalletPublicKey,
        agentWalletPublicKey: input.agentWalletPublicKey,
        agentWalletPrivateKey: input.agentWalletPrivateKey,
      });

    if (!validationResult.ok) {
      return {
        ok: false,
        validationStatus: mapErrorCodeToValidationStatus(
          validationResult.errorCode,
        ),
        errorCode: validationResult.errorCode,
      };
    }

    const credential = await dependencies.credentialRepository.save({
      id: dependencies.createCredentialId(),
      walletAddress: input.mainWalletPublicKey,
      publicKey: input.agentWalletPublicKey,
      encryptedPrivateKeyRef: encryptedSecret.encryptedPrivateKeyRef,
      keyFingerprint: encryptedSecret.keyFingerprint,
      validationStatus: "valid",
      operationallyVerified: false,
      lastValidatedAt: validationResult.validatedAt,
      lastValidationErrorCode: null,
      lastOperationalVerifiedAt: null,
      lastOperationalErrorCode: null,
      lastOperationalProbeJson: null,
    });

    return {
      ok: true,
      credentialId: credential.id,
      keyFingerprint: credential.keyFingerprint,
      validationStatus: "valid",
      validatedAt: validationResult.validatedAt,
      reusedExistingCredential: false,
    };
  };
}

function mapErrorCodeToValidationStatus(
  errorCode: PacificaCredentialValidationErrorCode,
): "invalid" | "error" {
  switch (errorCode) {
    case "provider_unavailable":
    case "rate_limited":
    case "internal_error":
      return "error";
    default:
      return "invalid";
  }
}
