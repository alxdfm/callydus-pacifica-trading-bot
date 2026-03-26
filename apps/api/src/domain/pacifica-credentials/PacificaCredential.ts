export type CredentialValidationStatus =
  | "pending"
  | "validating"
  | "valid"
  | "invalid"
  | "error";

export type PacificaCredential = {
  id: string;
  operatorAccountId: string;
  publicKey: string;
  encryptedPrivateKeyRef: string;
  keyFingerprint: string;
  validationStatus: CredentialValidationStatus;
  lastValidatedAt: string | null;
  lastValidationErrorCode: string | null;
};
