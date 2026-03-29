import type { CredentialEncryptionPort } from "../../domain/pacifica-credentials/CredentialEncryptionPort";
import type { OperationalEventRepository } from "../../domain/operational-events/OperationalEventRepository";
import type { PacificaCredentialRepository } from "../../domain/pacifica-credentials/PacificaCredentialRepository";
import type {
  PacificaCredentialValidationErrorCode,
  PacificaCredentialValidationPort,
} from "../../domain/pacifica-credentials/PacificaCredentialValidationPort";

export type ValidatePacificaCredentialsInput = {
  mainWalletPublicKey: string;
  agentWalletPublicKey: string;
  agentWalletPrivateKey: string;
  credentialAlias: string | null | undefined;
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
  eventRepository?: OperationalEventRepository;
};

/**
 * Creates the Agent Wallet validation use case.
 *
 * Responsibility:
 * - encrypt the submitted private key
 * - reuse an equivalent valid credential when possible
 * - call the external credential validation port when needed
 * - persist a new validated credential in `pending` lifecycle when required
 */
export function createValidatePacificaCredentials(
  dependencies: ValidatePacificaCredentialsDependencies,
) {
  /**
   * Validates and persists an Agent Wallet credential candidate.
   */
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
      await dependencies.eventRepository?.appendOperationalEvent({
        walletAddress: input.mainWalletPublicKey,
        eventType: "credential_validation",
        severity: "info",
        title: "Credential reused",
        message: "An equivalent validated Agent Wallet credential was reused.",
        payloadJson: {
          credentialId: existingCredential.id,
          publicKey: input.agentWalletPublicKey,
          reusedExistingCredential: true,
        },
      });
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

    const latestCredential =
      await dependencies.credentialRepository.findLatestCredentialByWalletAndPublicKey(
        {
          walletAddress: input.mainWalletPublicKey,
          publicKey: input.agentWalletPublicKey,
        },
      );

    if (latestCredential?.validationStatus === "valid") {
      const decryptedPrivateKey =
        await dependencies.credentialEncryption.decryptAgentWalletPrivateKey({
          encryptedPrivateKeyRef: latestCredential.encryptedPrivateKeyRef,
        });

      if (decryptedPrivateKey.trim() === input.agentWalletPrivateKey.trim()) {
        await dependencies.eventRepository?.appendOperationalEvent({
          walletAddress: input.mainWalletPublicKey,
          eventType: "credential_validation",
          severity: "info",
          title: "Credential reused",
          message: "The latest validated Agent Wallet credential was reused.",
          payloadJson: {
            credentialId: latestCredential.id,
            publicKey: input.agentWalletPublicKey,
            reusedExistingCredential: true,
          },
        });
        return {
          ok: true,
          credentialId: latestCredential.id,
          keyFingerprint: latestCredential.keyFingerprint,
          validationStatus: "valid",
          validatedAt:
            latestCredential.lastValidatedAt ?? new Date().toISOString(),
          reusedExistingCredential: true,
        };
      }
    }

    const validationResult =
      await dependencies.credentialValidation.validateAgentWallet({
        mainWalletPublicKey: input.mainWalletPublicKey,
        agentWalletPublicKey: input.agentWalletPublicKey,
        agentWalletPrivateKey: input.agentWalletPrivateKey,
      });

    if (!validationResult.ok) {
      await dependencies.eventRepository?.appendOperationalEvent({
        walletAddress: input.mainWalletPublicKey,
        eventType: "credential_validation",
        severity:
          mapErrorCodeToValidationStatus(validationResult.errorCode) === "error"
            ? "error"
            : "warning",
        title: "Credential validation failed",
        message: `Agent Wallet validation failed with ${validationResult.errorCode}.`,
        payloadJson: {
          publicKey: input.agentWalletPublicKey,
          errorCode: validationResult.errorCode,
        },
      });
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
      credentialAlias: input.credentialAlias?.trim() || null,
      publicKey: input.agentWalletPublicKey,
      encryptedPrivateKeyRef: encryptedSecret.encryptedPrivateKeyRef,
      keyFingerprint: encryptedSecret.keyFingerprint,
      validationStatus: "valid",
      lifecycleStatus: "pending",
      operationallyVerified: false,
      lastValidatedAt: validationResult.validatedAt,
      lastValidationErrorCode: null,
      lastOperationalVerifiedAt: null,
      lastOperationalErrorCode: null,
      lastOperationalProbeJson: null,
    });

    await dependencies.eventRepository?.appendOperationalEvent({
      walletAddress: input.mainWalletPublicKey,
      eventType: "credential_validation",
      severity: "info",
      title: "Credential validated",
      message: "Agent Wallet credentials were validated successfully.",
      payloadJson: {
        credentialId: credential.id,
        publicKey: input.agentWalletPublicKey,
        reusedExistingCredential: false,
      },
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

/**
 * Maps low-level validation failure reasons into the product's higher-level
 * validation status buckets.
 */
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
