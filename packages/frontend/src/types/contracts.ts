import { z } from "zod";

export const onboardingStatusSchema = z.enum([
  "wallet_pending",
  "credentials_pending",
  "credentials_validating",
  "ready",
  "blocked",
]);

export const credentialValidationStatusSchema = z.enum([
  "pending",
  "validating",
  "valid",
  "invalid",
  "error",
]);

export const builderApprovalStatusSchema = z.enum([
  "pending",
  "approving",
  "approved",
  "rejected",
  "error",
]);

export const operationalVerificationStatusSchema = z.enum([
  "pending",
  "verifying",
  "verified",
  "blocked",
  "error",
]);

export const walletSessionStatusSchema = z.enum([
  "disconnected",
  "reconnecting",
  "connected",
  "error",
]);

export const walletProviderSchema = z.enum(["phantom", "backpack"]);

export const walletErrorCodeSchema = z.enum([
  "wallet_provider_missing",
  "wallet_connection_rejected",
  "wallet_connection_failed",
  "wallet_session_lost",
  "wallet_unsupported",
]);

export const pacificaValidationErrorCodeSchema = z.enum([
  "wallet_not_connected",
  "invalid_agent_wallet_format",
  "invalid_agent_wallet_secret",
  "account_not_found",
  "agent_wallet_mismatch",
  "builder_approval_rejected",
  "builder_fee_limit_too_low",
  "validation_rejected",
  "provider_unavailable",
  "rate_limited",
  "internal_error",
]);

export const pacificaBuilderApprovalErrorCodeSchema = z.enum([
  "wallet_not_connected",
  "wallet_signature_unavailable",
  "wallet_signature_rejected",
  "builder_approval_rejected",
  "provider_unavailable",
  "rate_limited",
  "internal_error",
]);

export const pacificaOperationalVerificationErrorCodeSchema = z.enum([
  "credential_not_found",
  "credential_not_valid",
  "probe_market_config_invalid",
  "signature_rejected",
  "agent_wallet_unauthorized_for_account",
  "account_blocked",
  "provider_unavailable",
  "rate_limited",
  "internal_error",
]);

export const walletSessionSchema = z.object({
  provider: walletProviderSchema.nullable(),
  mainWalletPublicKey: z.string().min(1).nullable(),
  sessionStatus: walletSessionStatusSchema,
  lastConnectedAt: z.string().datetime().nullable(),
  errorCode: walletErrorCodeSchema.nullable(),
});

export const pacificaCredentialSubmissionSchema = z.object({
  mainWalletPublicKey: z.string().min(1),
  agentWalletPublicKey: z.string().min(1),
  agentWalletPrivateKey: z.string().min(1),
  credentialAlias: z.string().trim().min(1).max(64).optional().nullable(),
});

export const pacificaCredentialValidationSuccessSchema = z.object({
  status: z.literal("valid"),
  credentialId: z.string().uuid(),
  mainWalletPublicKey: z.string().min(1),
  agentWalletPublicKey: z.string().min(1),
  keyFingerprint: z.string().min(1),
  validationStatus: z.literal("valid"),
  validatedAt: z.string().datetime(),
  canProceed: z.literal(true),
});

export const pacificaCredentialValidationErrorSchema = z.object({
  status: z.enum(["invalid", "error"]),
  code: pacificaValidationErrorCodeSchema,
  message: z.string().min(1),
  retryable: z.boolean(),
  field: z
    .enum([
      "mainWalletPublicKey",
      "agentWalletPublicKey",
      "agentWalletPrivateKey",
    ])
    .nullable(),
  canProceed: z.literal(false),
});

export const pacificaCredentialValidationResponseSchema = z.union([
  pacificaCredentialValidationSuccessSchema,
  pacificaCredentialValidationErrorSchema,
]);

export const pacificaBuilderApprovalSubmissionSchema = z.object({
  mainWalletPublicKey: z.string().min(1),
  builderCode: z.string().trim().min(1),
  maxFeeRate: z.string().trim().min(1),
  timestamp: z.number().int().positive(),
  expiryWindow: z.number().int().positive(),
  signature: z.string().trim().min(1),
});

export const pacificaBuilderApprovalSuccessSchema = z.object({
  status: z.literal("approved"),
  mainWalletPublicKey: z.string().min(1),
  builderCode: z.string().min(1),
  approvedAt: z.string().datetime(),
  canProceed: z.literal(true),
});

export const pacificaBuilderApprovalErrorSchema = z.object({
  status: z.enum(["rejected", "error"]),
  code: pacificaBuilderApprovalErrorCodeSchema,
  message: z.string().min(1),
  retryable: z.boolean(),
  canProceed: z.literal(false),
});

export const pacificaBuilderApprovalResponseSchema = z.union([
  pacificaBuilderApprovalSuccessSchema,
  pacificaBuilderApprovalErrorSchema,
]);

export const pacificaOperationalVerificationSubmissionSchema = z.object({
  credentialId: z.string().uuid(),
});

export const pacificaOperationalVerificationSuccessSchema = z.object({
  status: z.literal("verified"),
  credentialId: z.string().uuid(),
  operationalVerificationStatus: z.literal("verified"),
  verifiedAt: z.string().datetime(),
  probeSymbol: z.string().min(1),
  probeClientOrderId: z.string().uuid(),
  canProceed: z.literal(true),
});

export const pacificaOperationalVerificationErrorSchema = z.object({
  status: z.enum(["blocked", "error"]),
  code: pacificaOperationalVerificationErrorCodeSchema,
  message: z.string().min(1),
  retryable: z.boolean(),
  canProceed: z.literal(false),
});

export const pacificaOperationalVerificationResponseSchema = z.union([
  pacificaOperationalVerificationSuccessSchema,
  pacificaOperationalVerificationErrorSchema,
]);

export const operationalAccountLookupRequestSchema = z.object({
  walletAddress: z.string().min(1),
});

export const operationalAccountLookupFoundSchema = z.object({
  status: z.literal("found"),
  walletAddress: z.string().min(1),
  accountExists: z.literal(true),
  onboardingStatus: onboardingStatusSchema,
  credentialId: z.string().uuid().nullable(),
  agentWalletPublicKey: z.string().nullable(),
  credentialAlias: z.string().nullable(),
  keyFingerprint: z.string().nullable(),
  operationallyVerified: z.boolean(),
  canAccessProduct: z.literal(true),
});

export const operationalAccountLookupNotFoundSchema = z.object({
  status: z.literal("not_found"),
  walletAddress: z.string().min(1),
  accountExists: z.literal(false),
  canAccessProduct: z.literal(false),
});

export const operationalAccountLookupErrorSchema = z.object({
  status: z.literal("error"),
  walletAddress: z.string().min(1),
  accountExists: z.literal(false),
  code: z.enum(["provider_unavailable", "internal_error"]),
  message: z.string().min(1),
  retryable: z.boolean(),
  canAccessProduct: z.literal(false),
});

export const operationalAccountLookupResponseSchema = z.union([
  operationalAccountLookupFoundSchema,
  operationalAccountLookupNotFoundSchema,
  operationalAccountLookupErrorSchema,
]);

export const pacificaBuilderApprovalOperationType = "approve_builder_code";

export function createPacificaBuilderApprovalSigningPayload(input: {
  builderCode: string;
  maxFeeRate: string;
  timestamp: number;
  expiryWindow: number;
}) {
  return {
    timestamp: input.timestamp,
    expiry_window: input.expiryWindow,
    type: pacificaBuilderApprovalOperationType,
    data: {
      builder_code: input.builderCode,
      max_fee_rate: input.maxFeeRate,
    },
  };
}

export function serializePacificaSigningPayload(payload: unknown): string {
  return JSON.stringify(sortKeysDeep(payload));
}

function sortKeysDeep(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => sortKeysDeep(item));
  }

  if (value && typeof value === "object") {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((accumulator, key) => {
        accumulator[key] = sortKeysDeep(
          (value as Record<string, unknown>)[key],
        );
        return accumulator;
      }, {});
  }

  return value;
}

export type OnboardingStatus = z.infer<typeof onboardingStatusSchema>;

export type CredentialValidationStatus = z.infer<typeof credentialValidationStatusSchema>;

export type BuilderApprovalStatus = z.infer<typeof builderApprovalStatusSchema>;

export type OperationalVerificationStatus = z.infer<typeof operationalVerificationStatusSchema>;

export type WalletProvider = z.infer<typeof walletProviderSchema>;

export type WalletErrorCode = z.infer<typeof walletErrorCodeSchema>;

export type PacificaValidationErrorCode = z.infer<typeof pacificaValidationErrorCodeSchema>;

export type PacificaOperationalVerificationErrorCode = z.infer<typeof pacificaOperationalVerificationErrorCodeSchema>;

export type WalletSession = z.infer<typeof walletSessionSchema>;

export type PacificaCredentialSubmission = z.infer<typeof pacificaCredentialSubmissionSchema>;

export type PacificaCredentialValidationResponse = z.infer<typeof pacificaCredentialValidationResponseSchema>;

export type PacificaBuilderApprovalSubmission = z.infer<typeof pacificaBuilderApprovalSubmissionSchema>;

export type PacificaBuilderApprovalResponse = z.infer<typeof pacificaBuilderApprovalResponseSchema>;

export type PacificaOperationalVerificationSubmission = z.infer<typeof pacificaOperationalVerificationSubmissionSchema>;

export type PacificaOperationalVerificationResponse = z.infer<typeof pacificaOperationalVerificationResponseSchema>;

export type OperationalAccountLookupRequest = z.infer<typeof operationalAccountLookupRequestSchema>;

export type OperationalAccountLookupResponse = z.infer<typeof operationalAccountLookupResponseSchema>;
