-- CreateEnum
CREATE TYPE "OnboardingStatus" AS ENUM ('wallet_pending', 'credentials_pending', 'credentials_validating', 'ready', 'blocked');

-- CreateEnum
CREATE TYPE "CredentialValidationStatus" AS ENUM ('pending', 'validating', 'valid', 'invalid', 'error');

-- CreateEnum
CREATE TYPE "CredentialLifecycleStatus" AS ENUM ('pending', 'active', 'replaced');

-- CreateEnum
CREATE TYPE "BotStatus" AS ENUM ('inactive', 'active', 'paused', 'syncing', 'error');

-- CreateEnum
CREATE TYPE "PacificaConnectionStatus" AS ENUM ('disconnected', 'connecting', 'connected', 'degraded', 'error');

-- CreateEnum
CREATE TYPE "ExchangeSnapshotStatus" AS ENUM ('confirmed', 'last_known');

-- CreateEnum
CREATE TYPE "SyncStatus" AS ENUM ('idle', 'syncing', 'healthy', 'degraded', 'error');

-- CreateEnum
CREATE TYPE "PresetActivationStatus" AS ENUM ('pending', 'active', 'paused', 'stopped', 'failed');

-- CreateEnum
CREATE TYPE "PositionSizeType" AS ENUM ('fixed_amount', 'balance_percent');

-- CreateEnum
CREATE TYPE "CommandType" AS ENUM ('validate_credentials', 'activate_preset', 'pause_bot', 'resume_bot', 'close_trade');

-- CreateEnum
CREATE TYPE "SignalDecisionStatus" AS ENUM ('pending', 'processing', 'completed', 'failed', 'cancelled');

-- CreateEnum
CREATE TYPE "CommandStatus" AS ENUM ('pending', 'running', 'completed', 'failed', 'cancelled');

-- CreateEnum
CREATE TYPE "TargetType" AS ENUM ('credential', 'preset_activation', 'trade', 'bot');

-- CreateEnum
CREATE TYPE "TradeStatus" AS ENUM ('open', 'close_requested', 'closing', 'sync_error');

-- CreateEnum
CREATE TYPE "TradeSide" AS ENUM ('long', 'short');

-- CreateEnum
CREATE TYPE "CloseReason" AS ENUM ('take_profit', 'stop_loss', 'manual', 'system', 'error');

-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('connection', 'runtime', 'reconciliation', 'command');

-- CreateEnum
CREATE TYPE "AlertSeverity" AS ENUM ('info', 'warning', 'error');

-- CreateEnum
CREATE TYPE "OperationalEventType" AS ENUM ('credential_validation', 'operational_verification', 'signal_evaluation', 'order_execution', 'preset_activation', 'bot_command', 'runtime_reconciliation');

-- CreateEnum
CREATE TYPE "OrderExecutionStatus" AS ENUM ('pending', 'sent', 'failed');

-- CreateTable
CREATE TABLE "OperatorAccount" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "walletAddress" TEXT NOT NULL,
    "onboardingStatus" "OnboardingStatus" NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "OperatorAccount_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OperatorAccount_walletAddress_key" ON "OperatorAccount"("walletAddress");

-- CreateTable
CREATE TABLE "PacificaCredential" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "operatorAccountId" UUID,
    "walletAddress" TEXT,
    "credentialAlias" TEXT,
    "publicKey" TEXT NOT NULL,
    "encryptedPrivateKeyRef" TEXT NOT NULL,
    "keyFingerprint" TEXT NOT NULL,
    "validationStatus" "CredentialValidationStatus" NOT NULL,
    "lifecycleStatus" "CredentialLifecycleStatus" NOT NULL DEFAULT 'pending',
    "operationallyVerified" BOOLEAN NOT NULL DEFAULT false,
    "lastValidatedAt" TIMESTAMPTZ(6),
    "lastValidationErrorCode" TEXT,
    "lastOperationalVerifiedAt" TIMESTAMPTZ(6),
    "lastOperationalErrorCode" TEXT,
    "lastOperationalProbeJson" JSONB,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "PacificaCredential_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PacificaCredential_operatorAccountId_idx" ON "PacificaCredential"("operatorAccountId");
-- CreateIndex
CREATE INDEX "PacificaCredential_walletAddress_idx" ON "PacificaCredential"("walletAddress");
-- CreateIndex
CREATE INDEX "PacificaCredential_operatorAccountId_lifecycleStatus_idx" ON "PacificaCredential"("operatorAccountId", "lifecycleStatus");

-- AddForeignKey
ALTER TABLE "PacificaCredential" ADD CONSTRAINT "PacificaCredential_operatorAccountId_fkey" FOREIGN KEY ("operatorAccountId") REFERENCES "OperatorAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "PresetDefinition" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "riskLabel" TEXT NOT NULL,
    "frequencyLabel" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "baseContractJson" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "PresetDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PresetDefinition_slug_key" ON "PresetDefinition"("slug");

-- CreateTable
CREATE TABLE "PresetActivation" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "operatorAccountId" UUID NOT NULL,
    "presetDefinitionId" UUID NOT NULL,
    "activationStatus" "PresetActivationStatus" NOT NULL,
    "symbol" TEXT NOT NULL,
    "positionSizeType" "PositionSizeType" NOT NULL,
    "positionSizeValue" DECIMAL(24,8) NOT NULL,
    "longEnabled" BOOLEAN NOT NULL,
    "shortEnabled" BOOLEAN NOT NULL,
    "editableConfigJson" JSONB,
    "effectiveContractJson" JSONB NOT NULL,
    "activatedAt" TIMESTAMPTZ(6),
    "deactivatedAt" TIMESTAMPTZ(6),
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "PresetActivation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PresetActivation_operatorAccountId_idx" ON "PresetActivation"("operatorAccountId");
-- CreateIndex
CREATE INDEX "PresetActivation_activationStatus_idx" ON "PresetActivation"("activationStatus");
-- CreateIndex
CREATE INDEX "PresetActivation_operatorAccountId_activationStatus_idx" ON "PresetActivation"("operatorAccountId", "activationStatus");

-- AddForeignKey
ALTER TABLE "PresetActivation" ADD CONSTRAINT "PresetActivation_operatorAccountId_fkey" FOREIGN KEY ("operatorAccountId") REFERENCES "OperatorAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "PresetActivation" ADD CONSTRAINT "PresetActivation_presetDefinitionId_fkey" FOREIGN KEY ("presetDefinitionId") REFERENCES "PresetDefinition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "BotRuntimeState" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "operatorAccountId" UUID NOT NULL,
    "botStatus" "BotStatus" NOT NULL,
    "pacificaConnectionStatus" "PacificaConnectionStatus" NOT NULL,
    "syncStatus" "SyncStatus" NOT NULL,
    "exchangeSnapshotStatus" "ExchangeSnapshotStatus" NOT NULL DEFAULT 'last_known',
    "exchangeLastSyncedAt" TIMESTAMPTZ(6),
    "exchangeSnapshotMessage" TEXT,
    "activePresetActivationId" UUID,
    "workerOwnerId" TEXT,
    "workerLeaseExpiresAt" TIMESTAMPTZ(6),
    "workerLoopStartedAt" TIMESTAMPTZ(6),
    "lastHeartbeatAt" TIMESTAMPTZ(6),
    "lastSignalEvaluationAt" TIMESTAMPTZ(6),
    "lastSignalFingerprint" TEXT,
    "lastErrorMessage" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "BotRuntimeState_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BotRuntimeState_operatorAccountId_key" ON "BotRuntimeState"("operatorAccountId");
-- CreateIndex
CREATE INDEX "BotRuntimeState_workerOwnerId_workerLeaseExpiresAt_idx" ON "BotRuntimeState"("workerOwnerId", "workerLeaseExpiresAt");

-- AddForeignKey
ALTER TABLE "BotRuntimeState" ADD CONSTRAINT "BotRuntimeState_operatorAccountId_fkey" FOREIGN KEY ("operatorAccountId") REFERENCES "OperatorAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "BotRuntimeState" ADD CONSTRAINT "BotRuntimeState_activePresetActivationId_fkey" FOREIGN KEY ("activePresetActivationId") REFERENCES "PresetActivation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "SymbolOperationalConfig" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "operatorAccountId" UUID NOT NULL,
    "symbol" TEXT NOT NULL,
    "leverage" DECIMAL(12,4) NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "SymbolOperationalConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SymbolOperationalConfig_operatorAccountId_symbol_key" ON "SymbolOperationalConfig"("operatorAccountId", "symbol");
-- CreateIndex
CREATE INDEX "SymbolOperationalConfig_operatorAccountId_idx" ON "SymbolOperationalConfig"("operatorAccountId");

-- AddForeignKey
ALTER TABLE "SymbolOperationalConfig" ADD CONSTRAINT "SymbolOperationalConfig_operatorAccountId_fkey" FOREIGN KEY ("operatorAccountId") REFERENCES "OperatorAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "BotCommand" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "operatorAccountId" UUID NOT NULL,
    "commandType" "CommandType" NOT NULL,
    "targetType" "TargetType",
    "targetId" UUID,
    "payloadJson" JSONB,
    "requestedBy" TEXT NOT NULL,
    "commandStatus" "CommandStatus" NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "requestedAt" TIMESTAMPTZ(6) NOT NULL,
    "startedAt" TIMESTAMPTZ(6),
    "finishedAt" TIMESTAMPTZ(6),
    "failureReason" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "BotCommand_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BotCommand_idempotencyKey_key" ON "BotCommand"("idempotencyKey");
-- CreateIndex
CREATE INDEX "BotCommand_commandStatus_idx" ON "BotCommand"("commandStatus");
-- CreateIndex
CREATE INDEX "BotCommand_operatorAccountId_requestedAt_idx" ON "BotCommand"("operatorAccountId", "requestedAt" DESC);
-- CreateIndex
CREATE INDEX "BotCommand_targetType_targetId_idx" ON "BotCommand"("targetType", "targetId");

-- AddForeignKey
ALTER TABLE "BotCommand" ADD CONSTRAINT "BotCommand_operatorAccountId_fkey" FOREIGN KEY ("operatorAccountId") REFERENCES "OperatorAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "SignalDecision" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "operatorAccountId" UUID NOT NULL,
    "presetActivationId" UUID NOT NULL,
    "signalFingerprint" TEXT NOT NULL,
    "decisionStatus" "SignalDecisionStatus" NOT NULL,
    "signalSide" "TradeSide" NOT NULL,
    "symbol" TEXT NOT NULL,
    "marketSymbol" TEXT NOT NULL,
    "timeframe" TEXT NOT NULL,
    "priceSource" TEXT NOT NULL,
    "candleOpenTime" TIMESTAMPTZ(6) NOT NULL,
    "candleCloseTime" TIMESTAMPTZ(6) NOT NULL,
    "entryReferencePrice" DECIMAL(24,8) NOT NULL,
    "stopLossPrice" DECIMAL(24,8) NOT NULL,
    "takeProfitPrice" DECIMAL(24,8) NOT NULL,
    "riskDistance" DECIMAL(24,8) NOT NULL,
    "payloadJson" JSONB,
    "requestedAt" TIMESTAMPTZ(6) NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "SignalDecision_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SignalDecision_decisionStatus_idx" ON "SignalDecision"("decisionStatus");
-- CreateIndex
CREATE INDEX "SignalDecision_operatorAccountId_requestedAt_idx" ON "SignalDecision"("operatorAccountId", "requestedAt" DESC);
-- CreateIndex
CREATE INDEX "SignalDecision_presetActivationId_requestedAt_idx" ON "SignalDecision"("presetActivationId", "requestedAt" DESC);
-- CreateIndex
CREATE INDEX "SignalDecision_operatorAccountId_signalFingerprint_decisionStatus_idx" ON "SignalDecision"("operatorAccountId", "signalFingerprint", "decisionStatus");

-- AddForeignKey
ALTER TABLE "SignalDecision" ADD CONSTRAINT "SignalDecision_operatorAccountId_fkey" FOREIGN KEY ("operatorAccountId") REFERENCES "OperatorAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "SignalDecision" ADD CONSTRAINT "SignalDecision_presetActivationId_fkey" FOREIGN KEY ("presetActivationId") REFERENCES "PresetActivation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "OrderExecutionAttempt" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "operatorAccountId" UUID NOT NULL,
    "presetActivationId" UUID NOT NULL,
    "signalDecisionId" UUID NOT NULL,
    "executionStatus" "OrderExecutionStatus" NOT NULL,
    "clientOrderId" TEXT NOT NULL,
    "signalFingerprint" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "marketSymbol" TEXT NOT NULL,
    "orderSide" "TradeSide" NOT NULL,
    "requestedNotionalUsd" DECIMAL(24,8) NOT NULL,
    "requestedQuantity" DECIMAL(24,8) NOT NULL,
    "entryReferencePrice" DECIMAL(24,8) NOT NULL,
    "slippagePercent" DECIMAL(24,8) NOT NULL,
    "requestJson" JSONB,
    "responseJson" JSONB,
    "failureReason" TEXT,
    "retryableFailure" BOOLEAN NOT NULL DEFAULT false,
    "pacificaOrderId" TEXT,
    "requestedAt" TIMESTAMPTZ(6) NOT NULL,
    "finishedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "OrderExecutionAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OrderExecutionAttempt_clientOrderId_key" ON "OrderExecutionAttempt"("clientOrderId");
-- CreateIndex
CREATE INDEX "OrderExecutionAttempt_operatorAccountId_requestedAt_idx" ON "OrderExecutionAttempt"("operatorAccountId", "requestedAt" DESC);
-- CreateIndex
CREATE INDEX "OrderExecutionAttempt_signalDecisionId_requestedAt_idx" ON "OrderExecutionAttempt"("signalDecisionId", "requestedAt" DESC);
-- CreateIndex
CREATE INDEX "OrderExecutionAttempt_executionStatus_requestedAt_idx" ON "OrderExecutionAttempt"("executionStatus", "requestedAt" DESC);

-- AddForeignKey
ALTER TABLE "OrderExecutionAttempt" ADD CONSTRAINT "OrderExecutionAttempt_operatorAccountId_fkey" FOREIGN KEY ("operatorAccountId") REFERENCES "OperatorAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "OrderExecutionAttempt" ADD CONSTRAINT "OrderExecutionAttempt_presetActivationId_fkey" FOREIGN KEY ("presetActivationId") REFERENCES "PresetActivation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "OrderExecutionAttempt" ADD CONSTRAINT "OrderExecutionAttempt_signalDecisionId_fkey" FOREIGN KEY ("signalDecisionId") REFERENCES "SignalDecision"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "OpenTrade" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "operatorAccountId" UUID NOT NULL,
    "pacificaTradeId" TEXT NOT NULL,
    "presetActivationId" UUID,
    "stopLossPrice" DECIMAL(24,8),
    "takeProfitPrice" DECIMAL(24,8),
    "entryClientOrderId" TEXT,
    "pacificaOrderId" TEXT,
    "symbol" TEXT NOT NULL,
    "side" "TradeSide" NOT NULL,
    "entryPrice" DECIMAL(24,8) NOT NULL,
    "currentPrice" DECIMAL(24,8) NOT NULL,
    "quantity" DECIMAL(24,8) NOT NULL,
    "capitalAllocated" DECIMAL(24,8) NOT NULL,
    "unrealizedPnl" DECIMAL(24,8) NOT NULL,
    "tradeStatus" "TradeStatus" NOT NULL,
    "openedAt" TIMESTAMPTZ(6) NOT NULL,
    "closeRequestedAt" TIMESTAMPTZ(6),
    "closeReasonPending" "CloseReason",
    "isPlatformTrade" BOOLEAN NOT NULL,
    "lastSyncedAt" TIMESTAMPTZ(6) NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "OpenTrade_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OpenTrade_operatorAccountId_pacificaTradeId_key" ON "OpenTrade"("operatorAccountId", "pacificaTradeId");
-- CreateIndex
CREATE INDEX "OpenTrade_operatorAccountId_idx" ON "OpenTrade"("operatorAccountId");
-- CreateIndex
CREATE INDEX "OpenTrade_tradeStatus_idx" ON "OpenTrade"("tradeStatus");
-- CreateIndex
CREATE INDEX "OpenTrade_operatorAccountId_openedAt_idx" ON "OpenTrade"("operatorAccountId", "openedAt" DESC);

-- AddForeignKey
ALTER TABLE "OpenTrade" ADD CONSTRAINT "OpenTrade_operatorAccountId_fkey" FOREIGN KEY ("operatorAccountId") REFERENCES "OperatorAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "OpenTrade" ADD CONSTRAINT "OpenTrade_presetActivationId_fkey" FOREIGN KEY ("presetActivationId") REFERENCES "PresetActivation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "ClosedTrade" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "operatorAccountId" UUID NOT NULL,
    "pacificaTradeId" TEXT NOT NULL,
    "presetActivationId" UUID,
    "symbol" TEXT NOT NULL,
    "side" "TradeSide" NOT NULL,
    "entryPrice" DECIMAL(24,8) NOT NULL,
    "exitPrice" DECIMAL(24,8) NOT NULL,
    "quantity" DECIMAL(24,8) NOT NULL,
    "capitalAllocated" DECIMAL(24,8) NOT NULL,
    "realizedPnl" DECIMAL(24,8) NOT NULL,
    "closeReason" "CloseReason" NOT NULL,
    "openedAt" TIMESTAMPTZ(6) NOT NULL,
    "closedAt" TIMESTAMPTZ(6) NOT NULL,
    "isPlatformTrade" BOOLEAN NOT NULL,
    "closedByCommandId" UUID,
    "lastSyncedAt" TIMESTAMPTZ(6) NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClosedTrade_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClosedTrade_operatorAccountId_closedAt_idx" ON "ClosedTrade"("operatorAccountId", "closedAt" DESC);
-- CreateIndex
CREATE INDEX "ClosedTrade_presetActivationId_idx" ON "ClosedTrade"("presetActivationId");
-- CreateIndex
CREATE INDEX "ClosedTrade_closeReason_idx" ON "ClosedTrade"("closeReason");

-- AddForeignKey
ALTER TABLE "ClosedTrade" ADD CONSTRAINT "ClosedTrade_operatorAccountId_fkey" FOREIGN KEY ("operatorAccountId") REFERENCES "OperatorAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "ClosedTrade" ADD CONSTRAINT "ClosedTrade_presetActivationId_fkey" FOREIGN KEY ("presetActivationId") REFERENCES "PresetActivation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "ClosedTrade" ADD CONSTRAINT "ClosedTrade_closedByCommandId_fkey" FOREIGN KEY ("closedByCommandId") REFERENCES "BotCommand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "AccountBalanceSnapshot" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "operatorAccountId" UUID NOT NULL,
    "totalBalance" DECIMAL(24,8) NOT NULL,
    "availableBalance" DECIMAL(24,8) NOT NULL,
    "aggregatedPnl" DECIMAL(24,8) NOT NULL,
    "capitalInUse" DECIMAL(24,8) NOT NULL,
    "capturedAt" TIMESTAMPTZ(6) NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccountBalanceSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AccountBalanceSnapshot_operatorAccountId_capturedAt_idx" ON "AccountBalanceSnapshot"("operatorAccountId", "capturedAt" DESC);

-- AddForeignKey
ALTER TABLE "AccountBalanceSnapshot" ADD CONSTRAINT "AccountBalanceSnapshot_operatorAccountId_fkey" FOREIGN KEY ("operatorAccountId") REFERENCES "OperatorAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "OperationalAlert" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "operatorAccountId" UUID NOT NULL,
    "alertType" "AlertType" NOT NULL,
    "severity" "AlertSeverity" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMPTZ(6),

    CONSTRAINT "OperationalAlert_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OperationalAlert_operatorAccountId_isActive_idx" ON "OperationalAlert"("operatorAccountId", "isActive");
-- CreateIndex
CREATE INDEX "OperationalAlert_severity_createdAt_idx" ON "OperationalAlert"("severity", "createdAt" DESC);

-- AddForeignKey
ALTER TABLE "OperationalAlert" ADD CONSTRAINT "OperationalAlert_operatorAccountId_fkey" FOREIGN KEY ("operatorAccountId") REFERENCES "OperatorAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "OperationalEvent" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "operatorAccountId" UUID,
    "walletAddress" TEXT,
    "eventType" "OperationalEventType" NOT NULL,
    "severity" "AlertSeverity" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "payloadJson" JSONB,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OperationalEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OperationalEvent_operatorAccountId_createdAt_idx" ON "OperationalEvent"("operatorAccountId", "createdAt" DESC);
-- CreateIndex
CREATE INDEX "OperationalEvent_walletAddress_createdAt_idx" ON "OperationalEvent"("walletAddress", "createdAt" DESC);
-- CreateIndex
CREATE INDEX "OperationalEvent_eventType_createdAt_idx" ON "OperationalEvent"("eventType", "createdAt" DESC);

-- AddForeignKey
ALTER TABLE "OperationalEvent" ADD CONSTRAINT "OperationalEvent_operatorAccountId_fkey" FOREIGN KEY ("operatorAccountId") REFERENCES "OperatorAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
