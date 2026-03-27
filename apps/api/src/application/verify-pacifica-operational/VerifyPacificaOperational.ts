import type { CredentialEncryptionPort } from "../../domain/pacifica-credentials/CredentialEncryptionPort";
import type { PacificaCredentialRepository } from "../../domain/pacifica-credentials/PacificaCredentialRepository";
import type { PacificaOperationalVerificationPort } from "../../domain/pacifica-operational/PacificaOperationalVerificationPort";

export type VerifyPacificaOperationalInput = {
  credentialId: string;
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
};

export function createVerifyPacificaOperational(
  dependencies: VerifyPacificaOperationalDependencies,
) {
  return async function verifyPacificaOperational(
    input: VerifyPacificaOperationalInput,
  ): Promise<VerifyPacificaOperationalOutput> {
    const credential = await dependencies.credentialRepository.findById(
      input.credentialId,
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
