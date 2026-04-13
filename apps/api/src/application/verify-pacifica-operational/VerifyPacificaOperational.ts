import type { CredentialEncryptionPort } from "../../domain/pacifica-credentials/CredentialEncryptionPort";
import type { OperationalEventRepository } from "../../domain/operational-events/OperationalEventRepository";
import type { PacificaCredentialRepository } from "../../domain/pacifica-credentials/PacificaCredentialRepository";
import type { PacificaOperationalVerificationPort } from "../../domain/pacifica-operational/PacificaOperationalVerificationPort";

export type VerifyPacificaOperationalInput = {
  credentialId: string;
  walletAddress: string;
};

export type VerifyPacificaOperationalOutput =
  | {
      ok: true;
      credentialId: string;
      operationalVerificationStatus: "verified";
      verifiedAt: string;
      probeSymbol: string;
      probeClientOrderId: string;
    }
  | {
      ok: false;
      operationalVerificationStatus: "blocked" | "error";
      errorCode:
        | "credential_not_found"
        | "credential_not_valid"
        | "probe_market_config_invalid"
        | "signature_rejected"
        | "agent_wallet_unauthorized_for_account"
        | "account_blocked"
        | "provider_unavailable"
        | "rate_limited"
        | "internal_error";
    };

export type VerifyPacificaOperationalDependencies = {
  credentialRepository: PacificaCredentialRepository;
  credentialEncryption: CredentialEncryptionPort;
  operationalVerification: PacificaOperationalVerificationPort;
  eventRepository?: OperationalEventRepository;
};

/**
 * Creates the operational-readiness verification use case.
 *
 * Responsibility:
 * - load a previously validated credential
 * - short-circuit when the credential is already operationally verified
 * - decrypt the stored Agent Wallet secret and run the operational probe
 * - persist the resulting verified/blocked/error state on the credential
 */
export function createVerifyPacificaOperational(
  dependencies: VerifyPacificaOperationalDependencies,
) {
  /**
   * Verifies whether a validated credential can actually operate on Pacifica.
   */
  return async function verifyPacificaOperational(
    input: VerifyPacificaOperationalInput,
  ): Promise<VerifyPacificaOperationalOutput> {
    const credential = await dependencies.credentialRepository.findById(
      input.credentialId,
      input.walletAddress,
    );

    if (!credential) {
      return {
        ok: false,
        operationalVerificationStatus: "error",
        errorCode: "credential_not_found",
      };
    }

    if (credential.validationStatus !== "valid") {
      return {
        ok: false,
        operationalVerificationStatus: "blocked",
        errorCode: "credential_not_valid",
      };
    }

    if (credential.operationallyVerified && credential.lastOperationalVerifiedAt) {
      await dependencies.eventRepository?.appendOperationalEvent({
        walletAddress: credential.walletAddress,
        eventType: "operational_verification",
        severity: "info",
        title: "Operational verification reused",
        message: "The current Agent Wallet was already operationally verified.",
        payloadJson: {
          credentialId: credential.id,
          reusedExistingVerification: true,
        },
      });
      return {
        ok: true,
        credentialId: credential.id,
        operationalVerificationStatus: "verified",
        verifiedAt: credential.lastOperationalVerifiedAt,
        probeSymbol:
          ((credential.lastOperationalProbeJson as { symbol?: string } | null)
            ?.symbol as string | undefined) ?? "BTC",
        probeClientOrderId:
          ((credential.lastOperationalProbeJson as {
            clientOrderId?: string;
          } | null)?.clientOrderId as string | undefined) ?? credential.id,
      };
    }

    const decryptedPrivateKey =
      await dependencies.credentialEncryption.decryptAgentWalletPrivateKey({
        encryptedPrivateKeyRef: credential.encryptedPrivateKeyRef,
      });

    const verificationResult =
      await dependencies.operationalVerification.verifyOperationalReadiness({
        mainWalletPublicKey: credential.walletAddress,
        agentWalletPublicKey: credential.publicKey,
        agentWalletPrivateKey: decryptedPrivateKey,
      });

    if (!verificationResult.ok) {
      await dependencies.credentialRepository.updateOperationalVerification({
        credentialId: credential.id,
        operationallyVerified: false,
        lastOperationalVerifiedAt: null,
        lastOperationalErrorCode: verificationResult.errorCode,
        lastOperationalProbeJson: verificationResult.probePayload,
      });

      await dependencies.eventRepository?.appendOperationalEvent({
        walletAddress: credential.walletAddress,
        eventType: "operational_verification",
        severity:
          verificationResult.errorCode === "provider_unavailable" ||
          verificationResult.errorCode === "rate_limited" ||
          verificationResult.errorCode === "internal_error"
            ? "error"
            : "warning",
        title: "Operational verification failed",
        message: `Operational verification failed with ${verificationResult.errorCode}.`,
        payloadJson: {
          credentialId: credential.id,
          errorCode: verificationResult.errorCode,
          probePayload: verificationResult.probePayload,
        },
      });

      return {
        ok: false,
        operationalVerificationStatus:
          verificationResult.errorCode === "provider_unavailable" ||
          verificationResult.errorCode === "rate_limited" ||
          verificationResult.errorCode === "internal_error"
            ? "error"
            : "blocked",
        errorCode: verificationResult.errorCode,
      };
    }

    await dependencies.credentialRepository.updateOperationalVerification({
      credentialId: credential.id,
      operationallyVerified: true,
      lastOperationalVerifiedAt: verificationResult.verifiedAt,
      lastOperationalErrorCode: null,
      lastOperationalProbeJson: verificationResult.probePayload,
    });

    await dependencies.eventRepository?.appendOperationalEvent({
      walletAddress: credential.walletAddress,
      eventType: "operational_verification",
      severity: "info",
      title: "Operational verification passed",
      message: "The Agent Wallet passed the operational readiness check.",
      payloadJson: {
        credentialId: credential.id,
        probeSymbol: verificationResult.probeSymbol,
        probeClientOrderId: verificationResult.probeClientOrderId,
      },
    });

    return {
      ok: true,
      credentialId: credential.id,
      operationalVerificationStatus: "verified",
      verifiedAt: verificationResult.verifiedAt,
      probeSymbol: verificationResult.probeSymbol,
      probeClientOrderId: verificationResult.probeClientOrderId,
    };
  };
}
