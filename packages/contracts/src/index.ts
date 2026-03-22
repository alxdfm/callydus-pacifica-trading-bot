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

export const walletSessionStatusSchema = z.enum([
  "disconnected",
  "reconnecting",
  "connected",
  "error",
]);

export const walletProviderSchema = z.enum(["phantom"]);

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
  "validation_rejected",
  "provider_unavailable",
  "rate_limited",
  "internal_error",
]);

export const botStatusSchema = z.enum([
  "inactive",
  "active",
  "paused",
  "syncing",
  "error",
]);

export const syncStatusSchema = z.enum([
  "idle",
  "syncing",
  "healthy",
  "degraded",
  "error",
]);

export const pacificaConnectionStatusSchema = z.enum([
  "disconnected",
  "connecting",
  "connected",
  "degraded",
  "error",
]);

export const presetActivationStatusSchema = z.enum([
  "pending",
  "active",
  "paused",
  "stopped",
  "failed",
]);

export const positionSizeTypeSchema = z.enum([
  "fixed_amount",
  "balance_percent",
]);

export const commandTypeSchema = z.enum([
  "validate_credentials",
  "activate_preset",
  "pause_bot",
  "resume_bot",
  "close_trade",
]);

export const commandStatusSchema = z.enum([
  "pending",
  "running",
  "completed",
  "failed",
  "cancelled",
]);

export const targetTypeSchema = z.enum([
  "credential",
  "preset_activation",
  "trade",
  "bot",
]);

export const tradeStatusSchema = z.enum([
  "open",
  "close_requested",
  "closing",
  "sync_error",
]);

export const closeReasonSchema = z.enum([
  "take_profit",
  "stop_loss",
  "manual",
  "system",
  "error",
]);

export const tradeSideSchema = z.enum(["long", "short"]);

export const alertSeveritySchema = z.enum(["info", "warning", "error"]);

export const alertTypeSchema = z.enum([
  "connection",
  "runtime",
  "reconciliation",
  "command",
]);

export const presetDefinitionSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  slug: z.string().min(1),
  version: z.number().int().positive(),
  riskLabel: z.string().min(1),
  frequencyLabel: z.string().min(1),
  description: z.string().min(1),
  isActive: z.boolean(),
});

export const presetEditableConfigSchema = z.object({
  symbol: z.string().min(1),
  positionSizeType: positionSizeTypeSchema,
  positionSizeValue: z.number().positive(),
  longEnabled: z.boolean(),
  shortEnabled: z.boolean(),
});

export const presetActivationSchema = z.object({
  id: z.string().uuid(),
  operatorAccountId: z.string().uuid(),
  presetDefinitionId: z.string().uuid(),
  activationStatus: presetActivationStatusSchema,
  editableConfig: presetEditableConfigSchema,
  activatedAt: z.string().datetime().nullable(),
  deactivatedAt: z.string().datetime().nullable(),
});

export const balanceSnapshotSchema = z.object({
  totalBalance: z.number(),
  availableBalance: z.number(),
  aggregatedPnl: z.number(),
  capitalInUse: z.number(),
  capturedAt: z.string().datetime(),
});

export const openTradeSchema = z.object({
  id: z.string().uuid(),
  pacificaTradeId: z.string().min(1),
  presetActivationId: z.string().uuid().nullable(),
  symbol: z.string().min(1),
  side: tradeSideSchema,
  entryPrice: z.number(),
  currentPrice: z.number(),
  quantity: z.number(),
  capitalAllocated: z.number(),
  unrealizedPnl: z.number(),
  tradeStatus: tradeStatusSchema,
  openedAt: z.string().datetime(),
  isPlatformTrade: z.boolean(),
});

export const closedTradeSchema = z.object({
  id: z.string().uuid(),
  pacificaTradeId: z.string().min(1),
  presetActivationId: z.string().uuid().nullable(),
  symbol: z.string().min(1),
  side: tradeSideSchema,
  entryPrice: z.number(),
  exitPrice: z.number(),
  quantity: z.number(),
  capitalAllocated: z.number(),
  realizedPnl: z.number(),
  closeReason: closeReasonSchema,
  openedAt: z.string().datetime(),
  closedAt: z.string().datetime(),
  isPlatformTrade: z.boolean(),
});

export const operationalAlertSchema = z.object({
  id: z.string().uuid(),
  alertType: alertTypeSchema,
  severity: alertSeveritySchema,
  title: z.string().min(1),
  message: z.string().min(1),
  isActive: z.boolean(),
  createdAt: z.string().datetime(),
  resolvedAt: z.string().datetime().nullable(),
});

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
  field: z.enum(["mainWalletPublicKey", "agentWalletPublicKey", "agentWalletPrivateKey"]).nullable(),
  canProceed: z.literal(false),
});

export const pacificaCredentialValidationResponseSchema = z.union([
  pacificaCredentialValidationSuccessSchema,
  pacificaCredentialValidationErrorSchema,
]);

export const botRuntimeStateSchema = z.object({
  botStatus: botStatusSchema,
  pacificaConnectionStatus: pacificaConnectionStatusSchema,
  syncStatus: syncStatusSchema,
  activePresetActivationId: z.string().uuid().nullable(),
  lastHeartbeatAt: z.string().datetime().nullable(),
  lastErrorMessage: z.string().nullable(),
});

export const onboardingContractSchema = z.object({
  walletAddress: z.string().nullable(),
  walletSession: walletSessionSchema,
  agentWalletPublicKey: z.string().nullable(),
  onboardingStatus: onboardingStatusSchema,
  credentialValidationStatus: credentialValidationStatusSchema,
  pacificaConnectionStatus: pacificaConnectionStatusSchema,
  accountReady: z.boolean(),
});

export const dashboardContractSchema = z.object({
  connectionStatus: pacificaConnectionStatusSchema,
  botStatus: botStatusSchema,
  balance: balanceSnapshotSchema,
  activePreset: presetActivationSchema.nullable(),
  activeTradesCount: z.number().int().nonnegative(),
  closedTradesTodayCount: z.number().int().nonnegative(),
  currentTrades: z.array(openTradeSchema),
  recentClosedTrades: z.array(closedTradeSchema),
  activeAlerts: z.array(operationalAlertSchema),
});

export const presetCatalogContractSchema = z.object({
  presets: z.array(presetDefinitionSchema),
  activePresetActivation: presetActivationSchema.nullable(),
});

export const presetActivationRequestSchema = z.object({
  presetDefinitionId: z.string().uuid(),
  editableConfig: presetEditableConfigSchema,
});

export const currentTradesContractSchema = z.object({
  openTrades: z.array(openTradeSchema),
});

export const historyContractSchema = z.object({
  closedTrades: z.array(closedTradeSchema),
});

export const botCommandContractSchema = z.object({
  id: z.string().uuid(),
  commandType: commandTypeSchema,
  commandStatus: commandStatusSchema,
  targetType: targetTypeSchema.nullable(),
  targetId: z.string().uuid().nullable(),
  requestedAt: z.string().datetime(),
  finishedAt: z.string().datetime().nullable(),
  failureReason: z.string().nullable(),
});

export type OnboardingStatus = z.infer<typeof onboardingStatusSchema>;
export type CredentialValidationStatus = z.infer<typeof credentialValidationStatusSchema>;
export type WalletSessionStatus = z.infer<typeof walletSessionStatusSchema>;
export type WalletProvider = z.infer<typeof walletProviderSchema>;
export type WalletErrorCode = z.infer<typeof walletErrorCodeSchema>;
export type PacificaValidationErrorCode = z.infer<typeof pacificaValidationErrorCodeSchema>;
export type BotStatus = z.infer<typeof botStatusSchema>;
export type SyncStatus = z.infer<typeof syncStatusSchema>;
export type PacificaConnectionStatus = z.infer<typeof pacificaConnectionStatusSchema>;
export type PresetActivationStatus = z.infer<typeof presetActivationStatusSchema>;
export type PositionSizeType = z.infer<typeof positionSizeTypeSchema>;
export type CommandType = z.infer<typeof commandTypeSchema>;
export type CommandStatus = z.infer<typeof commandStatusSchema>;
export type TargetType = z.infer<typeof targetTypeSchema>;
export type TradeStatus = z.infer<typeof tradeStatusSchema>;
export type CloseReason = z.infer<typeof closeReasonSchema>;
export type TradeSide = z.infer<typeof tradeSideSchema>;
export type AlertSeverity = z.infer<typeof alertSeveritySchema>;
export type AlertType = z.infer<typeof alertTypeSchema>;
export type PresetDefinition = z.infer<typeof presetDefinitionSchema>;
export type PresetEditableConfig = z.infer<typeof presetEditableConfigSchema>;
export type PresetActivation = z.infer<typeof presetActivationSchema>;
export type BalanceSnapshot = z.infer<typeof balanceSnapshotSchema>;
export type OpenTrade = z.infer<typeof openTradeSchema>;
export type ClosedTrade = z.infer<typeof closedTradeSchema>;
export type OperationalAlert = z.infer<typeof operationalAlertSchema>;
export type WalletSession = z.infer<typeof walletSessionSchema>;
export type PacificaCredentialSubmission = z.infer<typeof pacificaCredentialSubmissionSchema>;
export type PacificaCredentialValidationSuccess = z.infer<typeof pacificaCredentialValidationSuccessSchema>;
export type PacificaCredentialValidationError = z.infer<typeof pacificaCredentialValidationErrorSchema>;
export type PacificaCredentialValidationResponse = z.infer<typeof pacificaCredentialValidationResponseSchema>;
export type BotRuntimeState = z.infer<typeof botRuntimeStateSchema>;
export type OnboardingContract = z.infer<typeof onboardingContractSchema>;
export type DashboardContract = z.infer<typeof dashboardContractSchema>;
export type PresetCatalogContract = z.infer<typeof presetCatalogContractSchema>;
export type PresetActivationRequest = z.infer<typeof presetActivationRequestSchema>;
export type CurrentTradesContract = z.infer<typeof currentTradesContractSchema>;
export type HistoryContract = z.infer<typeof historyContractSchema>;
export type BotCommandContract = z.infer<typeof botCommandContractSchema>;
