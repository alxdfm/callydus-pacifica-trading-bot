export type CredentialValidationStatus =
  | "pending"
  | "validating"
  | "valid"
  | "invalid"
  | "error";

export type CredentialLifecycleStatus = "pending" | "active" | "replaced";

export type PacificaCredential = {
  id: string;
  operatorAccountId: string | null;
  walletAddress: string;
  credentialAlias: string | null;
  publicKey: string;
  encryptedPrivateKeyRef: string;
  keyFingerprint: string;
  validationStatus: CredentialValidationStatus;
  lifecycleStatus: CredentialLifecycleStatus;
  operationallyVerified: boolean;
  lastValidatedAt: string | null;
  lastValidationErrorCode: string | null;
  lastOperationalVerifiedAt: string | null;
  lastOperationalErrorCode: string | null;
  lastOperationalProbeJson: unknown | null;
};
