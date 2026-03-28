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

export const marketCandleIntervalSchema = z.enum([
  "1m",
  "3m",
  "5m",
  "15m",
  "30m",
  "1h",
  "2h",
  "4h",
  "6h",
  "12h",
  "1d",
]);

export const marketPriceSourceSchema = z.enum(["market", "mark"]);

export const presetTriggerScopeSchema = z.enum([
  "previousCandle",
  "currentCandle",
]);

export const presetThresholdOperatorSchema = z.enum([
  "above",
  "below",
  "atOrAbove",
  "atOrBelow",
  "equal",
]);

export const presetCrossOperatorSchema = z.enum([
  "crossesAbove",
  "crossesBelow",
]);

export const presetTriggerGroupTypeSchema = z.enum(["all", "any"]);

export const presetIndicatorEmaSchema = z.object({
  type: z.literal("ema"),
  period: z.number().int().positive(),
});

export const presetIndicatorRsiSchema = z.object({
  type: z.literal("rsi"),
  period: z.number().int().positive(),
});

export const presetIndicatorAtrSchema = z.object({
  type: z.literal("atr"),
  period: z.number().int().positive(),
});

export const presetIndicatorVolumeSchema = z.object({
  type: z.literal("volume"),
});

export const presetIndicatorSmaSchema = z.object({
  type: z.literal("sma"),
  source: z.string().min(1),
  period: z.number().int().positive(),
});

export const presetIndicatorConfigSchema = z.discriminatedUnion("type", [
  presetIndicatorEmaSchema,
  presetIndicatorRsiSchema,
  presetIndicatorAtrSchema,
  presetIndicatorVolumeSchema,
  presetIndicatorSmaSchema,
]);

export const presetThresholdRuleSchema = z.object({
  scope: presetTriggerScopeSchema,
  type: z.literal("threshold"),
  indicator: z.string().min(1),
  operator: presetThresholdOperatorSchema,
  value: z.number(),
});

export const presetCrossRuleSchema = z.object({
  scope: presetTriggerScopeSchema,
  type: z.literal("cross"),
  indicator: z.string().min(1),
  operator: presetCrossOperatorSchema,
  ref: z.string().min(1),
});

export const presetTriggerRuleSchema = z.discriminatedUnion("type", [
  presetThresholdRuleSchema,
  presetCrossRuleSchema,
]);

export const presetTriggerGroupSchema = z.object({
  type: presetTriggerGroupTypeSchema,
  rules: z.array(presetTriggerRuleSchema).min(1),
});

export const presetEntrySideSchema = z.object({
  enabled: z.boolean(),
  trigger: presetTriggerGroupSchema,
});

export const presetStopLossStaticSchema = z.object({
  mode: z.literal("static"),
  value: z.number().positive(),
  unit: z.literal("percent"),
});

export const presetStopLossAtrSchema = z.object({
  mode: z.literal("atr"),
  period: z.number().int().positive(),
  multiplier: z.number().positive(),
});

export const presetStopLossConfigSchema = z.discriminatedUnion("mode", [
  presetStopLossStaticSchema,
  presetStopLossAtrSchema,
]);

export const presetTakeProfitRrSchema = z.object({
  mode: z.literal("rr"),
  multiple: z.number().positive(),
});

export const presetTakeProfitConfigSchema = z.discriminatedUnion("mode", [
  presetTakeProfitRrSchema,
]);

export const presetTechnicalContractSchema = z.object({
  name: z.string().min(1),
  version: z.number().int().positive(),
  timeframe: marketCandleIntervalSchema,
  symbol: z.string().min(1),
  indicators: z.record(z.string().min(1), presetIndicatorConfigSchema),
  entry: z.object({
    long: presetEntrySideSchema,
    short: presetEntrySideSchema,
  }),
  risk: z.object({
    stopLoss: presetStopLossConfigSchema,
    takeProfit: presetTakeProfitConfigSchema,
  }),
  execution: z.object({
    positionSize: z.object({
      type: z.literal("fixedPercent"),
      value: z.number().positive(),
    }),
    onePositionPerSymbol: z.boolean(),
    manualCloseAllowed: z.boolean(),
    closeOppositePositionOnSignal: z.boolean(),
  }),
});

export const presetIndicatorSnapshotSchema = z.object({
  previous: z.number().nullable(),
  current: z.number().nullable(),
});

export const presetRuleEvaluationSchema = z.object({
  direction: tradeSideSchema,
  ruleIndex: z.number().int().nonnegative(),
  scope: presetTriggerScopeSchema,
  type: z.enum(["threshold", "cross"]),
  indicator: z.string().min(1),
  operator: z.string().min(1),
  ref: z.string().nullable(),
  value: z.number().nullable(),
  satisfied: z.boolean(),
  explanation: z.string().min(1),
});

export const presetSignalSchema = z.enum(["none", "long", "short"]);

export const presetSignalEvaluationRequestSchema = z.object({
  presetDefinitionId: z.string().uuid(),
  editableConfig: z.lazy(() => presetEditableConfigSchema),
  priceSource: marketPriceSourceSchema.default("market"),
});

export const presetSignalEvaluationSuccessSchema = z.object({
  status: z.literal("success"),
  presetDefinitionId: z.string().uuid(),
  symbol: z.string().min(1),
  marketSymbol: z.string().min(1),
  timeframe: marketCandleIntervalSchema,
  priceSource: marketPriceSourceSchema,
  evaluatedAt: z.string().datetime(),
  candlesUsed: z.number().int().positive(),
  signal: presetSignalSchema,
  longSignal: z.boolean(),
  shortSignal: z.boolean(),
  entryReferencePrice: z.number().positive(),
  indicators: z.record(z.string().min(1), presetIndicatorSnapshotSchema),
  longRiskPlan: z.object({
    side: z.literal("long"),
    entryPrice: z.number().positive(),
    stopLossPrice: z.number().positive(),
    takeProfitPrice: z.number().positive(),
    riskDistance: z.number().positive(),
  }),
  shortRiskPlan: z.object({
    side: z.literal("short"),
    entryPrice: z.number().positive(),
    stopLossPrice: z.number().positive(),
    takeProfitPrice: z.number().positive(),
    riskDistance: z.number().positive(),
  }),
  longRuleEvaluations: z.array(presetRuleEvaluationSchema),
  shortRuleEvaluations: z.array(presetRuleEvaluationSchema),
});

export const presetSignalEvaluationErrorCodeSchema = z.enum([
  "preset_not_found",
  "unsupported_symbol",
  "insufficient_market_data",
  "provider_unavailable",
  "rate_limited",
  "internal_error",
]);

export const presetSignalEvaluationErrorSchema = z.object({
  status: z.literal("error"),
  code: presetSignalEvaluationErrorCodeSchema,
  message: z.string().min(1),
  retryable: z.boolean(),
});

export const presetSignalEvaluationResponseSchema = z.union([
  presetSignalEvaluationSuccessSchema,
  presetSignalEvaluationErrorSchema,
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

export const marketPriceSnapshotSchema = z.object({
  symbol: z.string().min(1),
  markPrice: z.number(),
  indexPrice: z.number().nullable(),
  lastPrice: z.number().nullable(),
  volume24h: z.number().nullable(),
  openInterest: z.number().nullable(),
  fundingRate: z.number().nullable(),
  capturedAt: z.string().datetime(),
});

export const marketCandleSchema = z.object({
  symbol: z.string().min(1),
  interval: marketCandleIntervalSchema,
  openTime: z.number().int().nonnegative(),
  closeTime: z.number().int().nonnegative(),
  open: z.number(),
  high: z.number(),
  low: z.number(),
  close: z.number(),
  volume: z.number(),
});

export const marketCandleRequestSchema = z.object({
  symbol: z.string().min(1),
  interval: marketCandleIntervalSchema,
  priceSource: marketPriceSourceSchema,
  startTime: z.number().int().nonnegative(),
  endTime: z.number().int().nonnegative().optional(),
  limit: z.number().int().positive().max(1000).optional(),
});

export const marketCandleResponseSchema = z.union([
  z.object({
    status: z.literal("success"),
    symbol: z.string().min(1),
    interval: marketCandleIntervalSchema,
    priceSource: marketPriceSourceSchema,
    candles: z.array(marketCandleSchema),
  }),
  z.object({
    status: z.literal("error"),
    code: z.enum(["provider_unavailable", "internal_error"]),
    message: z.string().min(1),
    retryable: z.boolean(),
  }),
]);

export const marketPricesResponseSchema = z.union([
  z.object({
    status: z.literal("success"),
    prices: z.array(marketPriceSnapshotSchema),
  }),
  z.object({
    status: z.literal("error"),
    code: z.enum(["provider_unavailable", "internal_error"]),
    message: z.string().min(1),
    retryable: z.boolean(),
  }),
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

export const operationalSessionSnapshotRequestSchema = z.object({
  walletAddress: z.string().min(1),
});

export const operationalRuntimeSnapshotSchema = z.object({
  balance: balanceSnapshotSchema.nullable(),
  botStatus: botStatusSchema,
  syncStatus: syncStatusSchema,
  pacificaConnectionStatus: pacificaConnectionStatusSchema,
  activePresetActivationId: z.string().uuid().nullable(),
  lastHeartbeatAt: z.string().datetime().nullable(),
  lastErrorMessage: z.string().nullable(),
  currentTrades: z.array(openTradeSchema),
  closedTrades: z.array(closedTradeSchema),
  activeAlerts: z.array(operationalAlertSchema),
});

export const operationalSessionSnapshotFoundSchema = z.object({
  status: z.literal("found"),
  walletAddress: z.string().min(1),
  accountExists: z.literal(true),
  onboardingStatus: onboardingStatusSchema,
  credentialId: z.string().uuid().nullable(),
  agentWalletPublicKey: z.string().nullable(),
  credentialAlias: z.string().nullable(),
  keyFingerprint: z.string().nullable(),
  builderApproved: z.boolean(),
  operationallyVerified: z.boolean(),
  activePreset: presetActivationSchema.nullable(),
  runtime: operationalRuntimeSnapshotSchema,
  canAccessProduct: z.boolean(),
});

export const operationalSessionSnapshotNotFoundSchema = z.object({
  status: z.literal("not_found"),
  walletAddress: z.string().min(1),
  accountExists: z.literal(false),
  canAccessProduct: z.literal(false),
});

export const operationalSessionSnapshotErrorSchema = z.object({
  status: z.literal("error"),
  walletAddress: z.string().min(1),
  accountExists: z.literal(false),
  code: z.enum(["provider_unavailable", "internal_error"]),
  message: z.string().min(1),
  retryable: z.boolean(),
  canAccessProduct: z.literal(false),
});

export const operationalSessionSnapshotResponseSchema = z.union([
  operationalSessionSnapshotFoundSchema,
  operationalSessionSnapshotNotFoundSchema,
  operationalSessionSnapshotErrorSchema,
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
  walletAddress: z.string().min(1),
  presetDefinitionId: z.string().uuid(),
  editableConfig: presetEditableConfigSchema,
});

export const presetActivationErrorCodeSchema = z.enum([
  "wallet_not_connected",
  "account_not_ready",
  "preset_not_found",
  "internal_error",
]);

export const presetActivationSuccessSchema = z.object({
  status: z.literal("success"),
  activation: presetActivationSchema,
  runtime: botRuntimeStateSchema,
  message: z.string().min(1),
});

export const presetActivationErrorSchema = z.object({
  status: z.literal("error"),
  code: presetActivationErrorCodeSchema,
  message: z.string().min(1),
  retryable: z.boolean(),
});

export const presetActivationResponseSchema = z.union([
  presetActivationSuccessSchema,
  presetActivationErrorSchema,
]);

export const currentTradesContractSchema = z.object({
  openTrades: z.array(openTradeSchema),
});

export const SAFER_PRESET_DEFINITION_ID =
  "2d5a5641-c7ad-4ff0-9f75-4fbcb58a4d01";
export const BALANCED_PRESET_DEFINITION_ID =
  "54663f73-b1e9-4384-9057-48d68ba689b2";
export const MORE_ACTIVE_PRESET_DEFINITION_ID =
  "1242f0f9-7a5b-44ea-b32d-368ceba95a93";

export const presetTechnicalContractCatalog: Record<string, PresetTechnicalContract> = {
  [SAFER_PRESET_DEFINITION_ID]: presetTechnicalContractSchema.parse({
    name: "Safer",
    version: 1,
    timeframe: "15m",
    symbol: "BTC/USDC",
    indicators: {
      emaFast: { type: "ema", period: 12 },
      emaSlow: { type: "ema", period: 24 },
      rsi: { type: "rsi", period: 14 },
      atr: { type: "atr", period: 14 },
      volume: { type: "volume" },
      volumeSma: { type: "sma", source: "volume", period: 20 },
    },
    entry: {
      long: {
        enabled: true,
        trigger: {
          type: "all",
          rules: [
            {
              scope: "currentCandle",
              type: "cross",
              indicator: "emaFast",
              operator: "crossesAbove",
              ref: "emaSlow",
            },
            {
              scope: "currentCandle",
              type: "threshold",
              indicator: "rsi",
              operator: "below",
              value: 30,
            },
          ],
        },
      },
      short: {
        enabled: true,
        trigger: {
          type: "all",
          rules: [
            {
              scope: "currentCandle",
              type: "cross",
              indicator: "emaFast",
              operator: "crossesBelow",
              ref: "emaSlow",
            },
            {
              scope: "currentCandle",
              type: "threshold",
              indicator: "rsi",
              operator: "above",
              value: 70,
            },
          ],
        },
      },
    },
    risk: {
      stopLoss: { mode: "atr", period: 14, multiplier: 1.5 },
      takeProfit: { mode: "rr", multiple: 2 },
    },
    execution: {
      positionSize: { type: "fixedPercent", value: 3 },
      onePositionPerSymbol: true,
      manualCloseAllowed: true,
      closeOppositePositionOnSignal: false,
    },
  }),
  [BALANCED_PRESET_DEFINITION_ID]: presetTechnicalContractSchema.parse({
    name: "Balanced",
    version: 1,
    timeframe: "15m",
    symbol: "BTC/USDC",
    indicators: {
      emaFast: { type: "ema", period: 8 },
      emaSlow: { type: "ema", period: 21 },
      rsi: { type: "rsi", period: 14 },
      atr: { type: "atr", period: 14 },
      volume: { type: "volume" },
      volumeSma: { type: "sma", source: "volume", period: 20 },
    },
    entry: {
      long: {
        enabled: true,
        trigger: {
          type: "all",
          rules: [
            {
              scope: "currentCandle",
              type: "cross",
              indicator: "emaFast",
              operator: "crossesAbove",
              ref: "emaSlow",
            },
            {
              scope: "currentCandle",
              type: "threshold",
              indicator: "rsi",
              operator: "atOrAbove",
              value: 50,
            },
            {
              scope: "currentCandle",
              type: "cross",
              indicator: "volume",
              operator: "crossesAbove",
              ref: "volumeSma",
            },
          ],
        },
      },
      short: {
        enabled: true,
        trigger: {
          type: "all",
          rules: [
            {
              scope: "currentCandle",
              type: "cross",
              indicator: "emaFast",
              operator: "crossesBelow",
              ref: "emaSlow",
            },
            {
              scope: "currentCandle",
              type: "threshold",
              indicator: "rsi",
              operator: "atOrBelow",
              value: 50,
            },
            {
              scope: "currentCandle",
              type: "cross",
              indicator: "volume",
              operator: "crossesAbove",
              ref: "volumeSma",
            },
          ],
        },
      },
    },
    risk: {
      stopLoss: { mode: "static", value: 1.2, unit: "percent" },
      takeProfit: { mode: "rr", multiple: 2 },
    },
    execution: {
      positionSize: { type: "fixedPercent", value: 5 },
      onePositionPerSymbol: true,
      manualCloseAllowed: true,
      closeOppositePositionOnSignal: false,
    },
  }),
  [MORE_ACTIVE_PRESET_DEFINITION_ID]: presetTechnicalContractSchema.parse({
    name: "More active",
    version: 1,
    timeframe: "5m",
    symbol: "BTC/USDC",
    indicators: {
      emaFast: { type: "ema", period: 9 },
      emaSlow: { type: "ema", period: 18 },
      rsi: { type: "rsi", period: 14 },
      atr: { type: "atr", period: 14 },
      volume: { type: "volume" },
      volumeSma: { type: "sma", source: "volume", period: 20 },
    },
    entry: {
      long: {
        enabled: true,
        trigger: {
          type: "all",
          rules: [
            {
              scope: "currentCandle",
              type: "cross",
              indicator: "volume",
              operator: "crossesAbove",
              ref: "volumeSma",
            },
            {
              scope: "currentCandle",
              type: "cross",
              indicator: "emaFast",
              operator: "crossesAbove",
              ref: "emaSlow",
            },
            {
              scope: "currentCandle",
              type: "threshold",
              indicator: "rsi",
              operator: "atOrAbove",
              value: 45,
            },
          ],
        },
      },
      short: {
        enabled: true,
        trigger: {
          type: "all",
          rules: [
            {
              scope: "currentCandle",
              type: "cross",
              indicator: "volume",
              operator: "crossesAbove",
              ref: "volumeSma",
            },
            {
              scope: "currentCandle",
              type: "cross",
              indicator: "emaFast",
              operator: "crossesBelow",
              ref: "emaSlow",
            },
            {
              scope: "currentCandle",
              type: "threshold",
              indicator: "rsi",
              operator: "atOrBelow",
              value: 55,
            },
          ],
        },
      },
    },
    risk: {
      stopLoss: { mode: "static", value: 1, unit: "percent" },
      takeProfit: { mode: "rr", multiple: 1.6 },
    },
    execution: {
      positionSize: { type: "fixedPercent", value: 5 },
      onePositionPerSymbol: true,
      manualCloseAllowed: true,
      closeOppositePositionOnSignal: false,
    },
  }),
};

export function getPresetTechnicalContractByDefinitionId(
  presetDefinitionId: string | null | undefined,
): PresetTechnicalContract | null {
  if (!presetDefinitionId) {
    return null;
  }

  return presetTechnicalContractCatalog[presetDefinitionId] ?? null;
}

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
export type BuilderApprovalStatus = z.infer<typeof builderApprovalStatusSchema>;
export type OperationalVerificationStatus = z.infer<typeof operationalVerificationStatusSchema>;
export type WalletSessionStatus = z.infer<typeof walletSessionStatusSchema>;
export type WalletProvider = z.infer<typeof walletProviderSchema>;
export type WalletErrorCode = z.infer<typeof walletErrorCodeSchema>;
export type PacificaValidationErrorCode = z.infer<typeof pacificaValidationErrorCodeSchema>;
export type PacificaBuilderApprovalErrorCode = z.infer<typeof pacificaBuilderApprovalErrorCodeSchema>;
export type PacificaOperationalVerificationErrorCode = z.infer<typeof pacificaOperationalVerificationErrorCodeSchema>;
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
export type MarketCandleInterval = z.infer<typeof marketCandleIntervalSchema>;
export type MarketPriceSource = z.infer<typeof marketPriceSourceSchema>;
export type PresetTriggerScope = z.infer<typeof presetTriggerScopeSchema>;
export type PresetThresholdOperator = z.infer<typeof presetThresholdOperatorSchema>;
export type PresetCrossOperator = z.infer<typeof presetCrossOperatorSchema>;
export type PresetTriggerGroupType = z.infer<typeof presetTriggerGroupTypeSchema>;
export type PresetIndicatorConfig = z.infer<typeof presetIndicatorConfigSchema>;
export type PresetTriggerRule = z.infer<typeof presetTriggerRuleSchema>;
export type PresetTriggerGroup = z.infer<typeof presetTriggerGroupSchema>;
export type PresetTechnicalContract = z.infer<typeof presetTechnicalContractSchema>;
export type PresetIndicatorSnapshot = z.infer<typeof presetIndicatorSnapshotSchema>;
export type PresetRuleEvaluation = z.infer<typeof presetRuleEvaluationSchema>;
export type PresetSignal = z.infer<typeof presetSignalSchema>;
export type PresetDefinition = z.infer<typeof presetDefinitionSchema>;
export type PresetEditableConfig = z.infer<typeof presetEditableConfigSchema>;
export type PresetActivation = z.infer<typeof presetActivationSchema>;
export type BalanceSnapshot = z.infer<typeof balanceSnapshotSchema>;
export type OpenTrade = z.infer<typeof openTradeSchema>;
export type ClosedTrade = z.infer<typeof closedTradeSchema>;
export type OperationalAlert = z.infer<typeof operationalAlertSchema>;
export type MarketPriceSnapshot = z.infer<typeof marketPriceSnapshotSchema>;
export type MarketCandle = z.infer<typeof marketCandleSchema>;
export type MarketCandleRequest = z.infer<typeof marketCandleRequestSchema>;
export type MarketCandleResponse = z.infer<typeof marketCandleResponseSchema>;
export type MarketPricesResponse = z.infer<typeof marketPricesResponseSchema>;
export type PresetSignalEvaluationErrorCode = z.infer<
  typeof presetSignalEvaluationErrorCodeSchema
>;
export type PresetSignalEvaluationRequest = z.infer<
  typeof presetSignalEvaluationRequestSchema
>;
export type PresetSignalEvaluationSuccess = z.infer<
  typeof presetSignalEvaluationSuccessSchema
>;
export type PresetSignalEvaluationError = z.infer<
  typeof presetSignalEvaluationErrorSchema
>;
export type PresetSignalEvaluationResponse = z.infer<
  typeof presetSignalEvaluationResponseSchema
>;
export type WalletSession = z.infer<typeof walletSessionSchema>;
export type PacificaCredentialSubmission = z.infer<typeof pacificaCredentialSubmissionSchema>;
export type PacificaCredentialValidationSuccess = z.infer<typeof pacificaCredentialValidationSuccessSchema>;
export type PacificaCredentialValidationError = z.infer<typeof pacificaCredentialValidationErrorSchema>;
export type PacificaCredentialValidationResponse = z.infer<typeof pacificaCredentialValidationResponseSchema>;
export type PacificaBuilderApprovalSubmission = z.infer<typeof pacificaBuilderApprovalSubmissionSchema>;
export type PacificaBuilderApprovalSuccess = z.infer<typeof pacificaBuilderApprovalSuccessSchema>;
export type PacificaBuilderApprovalError = z.infer<typeof pacificaBuilderApprovalErrorSchema>;
export type PacificaBuilderApprovalResponse = z.infer<typeof pacificaBuilderApprovalResponseSchema>;
export type PacificaOperationalVerificationSubmission = z.infer<typeof pacificaOperationalVerificationSubmissionSchema>;
export type PacificaOperationalVerificationSuccess = z.infer<typeof pacificaOperationalVerificationSuccessSchema>;
export type PacificaOperationalVerificationError = z.infer<typeof pacificaOperationalVerificationErrorSchema>;
export type PacificaOperationalVerificationResponse = z.infer<typeof pacificaOperationalVerificationResponseSchema>;
export type OperationalAccountLookupRequest = z.infer<typeof operationalAccountLookupRequestSchema>;
export type OperationalAccountLookupFound = z.infer<typeof operationalAccountLookupFoundSchema>;
export type OperationalAccountLookupNotFound = z.infer<typeof operationalAccountLookupNotFoundSchema>;
export type OperationalAccountLookupError = z.infer<typeof operationalAccountLookupErrorSchema>;
export type OperationalAccountLookupResponse = z.infer<typeof operationalAccountLookupResponseSchema>;
export type OperationalSessionSnapshotRequest = z.infer<typeof operationalSessionSnapshotRequestSchema>;
export type OperationalRuntimeSnapshot = z.infer<typeof operationalRuntimeSnapshotSchema>;
export type OperationalSessionSnapshotFound = z.infer<typeof operationalSessionSnapshotFoundSchema>;
export type OperationalSessionSnapshotNotFound = z.infer<typeof operationalSessionSnapshotNotFoundSchema>;
export type OperationalSessionSnapshotError = z.infer<typeof operationalSessionSnapshotErrorSchema>;
export type OperationalSessionSnapshotResponse = z.infer<typeof operationalSessionSnapshotResponseSchema>;
export type BotRuntimeState = z.infer<typeof botRuntimeStateSchema>;
export type OnboardingContract = z.infer<typeof onboardingContractSchema>;
export type DashboardContract = z.infer<typeof dashboardContractSchema>;
export type PresetCatalogContract = z.infer<typeof presetCatalogContractSchema>;
export type PresetActivationRequest = z.infer<typeof presetActivationRequestSchema>;
export type PresetActivationErrorCode = z.infer<typeof presetActivationErrorCodeSchema>;
export type PresetActivationSuccess = z.infer<typeof presetActivationSuccessSchema>;
export type PresetActivationError = z.infer<typeof presetActivationErrorSchema>;
export type PresetActivationResponse = z.infer<typeof presetActivationResponseSchema>;
export type CurrentTradesContract = z.infer<typeof currentTradesContractSchema>;
export type HistoryContract = z.infer<typeof historyContractSchema>;
export type BotCommandContract = z.infer<typeof botCommandContractSchema>;
