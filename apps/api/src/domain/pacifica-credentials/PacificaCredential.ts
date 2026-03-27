export type CredentialValidationStatus =
  | "pending"
  | "validating"
  | "valid"
  | "invalid"
  | "error";

export type PacificaCredential = {
  id: string;
  operatorAccountId: string;
  walletAddress: string;
  publicKey: string;
  encryptedPrivateKeyRef: string;
  keyFingerprint: string;
  validationStatus: CredentialValidationStatus;
  operationallyVerified: boolean;
  lastValidatedAt: string | null;
  lastValidationErrorCode: string | null;
  lastOperationalVerifiedAt: string | null;
  lastOperationalErrorCode: string | null;
  lastOperationalProbeJson: unknown | null;
};
