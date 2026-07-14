import { randomUUID } from "node:crypto";
import type { CandleInterval, ExchangeInterface, StrategyConfig } from "@pacifica/shared";
import type { CandleBuffer } from "./candle-buffer.js";
import type { WorkerEnv } from "./config/env.js";
import { AesCredentialDecryptionService } from "./crypto/credential-encryption.js";
import type { DrizzleDb } from "./db/client.js";
import {
  getActiveCredentialForWallet,
  getActiveStrategies,
  getOpenTradesForStrategy,
  insertEvent,
  insertTrade,
  updateTrade,
  type Strategy,
  type Trade,
} from "./db/queries.js";
import {
  buildRiskPlans,
  evaluateSignal,
  getIntervalDurationMs,
  getRequiredPeriod,
  materializeYourStrategyTechnicalContract,
  toPacificaMarketSymbol,
  type YourStrategyDraft,
} from "./engine/evaluator.js";
import {
  normalizeMarketOrderInput,
  PacificaApiError,
  PacificaClient,
} from "./exchange/pacifica/client.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type BotLogger = {
  info: (...a: unknown[]) => void;
  warn: (...a: unknown[]) => void;
  error: (...a: unknown[]) => void;
};

type BotInput = {
  db: DrizzleDb;
  exchange: ExchangeInterface;
  candleBuffer: CandleBuffer;
  env: WorkerEnv;
  logger?: BotLogger;
};

const defaultLogger: BotLogger = {
  info: (...a) => console.info(...a),
  warn: (...a) => console.warn(...a),
  error: (...a) => console.error(...a),
};

// ---------------------------------------------------------------------------
// Pure helpers (exported for testing)
// ---------------------------------------------------------------------------

export function calculateUnrealizedPnl(input: {
  side: "long" | "short";
  entryPrice: number;
  currentPrice: number;
  quantity: number;
}): number {
  const priceDelta =
    input.side === "long"
      ? input.currentPrice - input.entryPrice
      : input.entryPrice - input.currentPrice;

  return priceDelta * input.quantity;
}

export function resolveAutomaticClose(input: {
  side: "long" | "short";
  stopLossPrice: number;
  takeProfitPrice: number;
  candleHigh: number;
  candleLow: number;
}): { closeReason: "stop_loss" | "take_profit"; exitPrice: number } | null {
  if (input.side === "long") {
    if (input.candleLow <= input.stopLossPrice) {
      return { closeReason: "stop_loss", exitPrice: input.stopLossPrice };
    }

    if (input.candleHigh >= input.takeProfitPrice) {
      return { closeReason: "take_profit", exitPrice: input.takeProfitPrice };
    }

    return null;
  }

  if (input.candleHigh >= input.stopLossPrice) {
    return { closeReason: "stop_loss", exitPrice: input.stopLossPrice };
  }

  if (input.candleLow <= input.takeProfitPrice) {
    return { closeReason: "take_profit", exitPrice: input.takeProfitPrice };
  }

  return null;
}

/**
 * Infers how a position was closed after it disappeared from the exchange.
 * When both TP and SL levels bracket currentPrice, stop-loss is preferred
 * for longs (price already traded through downside) and for shorts (upside).
 */
export function resolveDetectedClose(trade: {
  side: "long" | "short";
  stopLossPrice: number | null;
  takeProfitPrice: number | null;
  currentPrice: number;
  closeReasonPending: "take_profit" | "stop_loss" | "manual" | "system" | "error" | null;
}): {
  closeReason: "take_profit" | "stop_loss" | "manual" | "system";
  exitPrice: number;
} {
  if (trade.closeReasonPending === "manual") {
    return { closeReason: "manual", exitPrice: trade.currentPrice };
  }

  if (trade.side === "long") {
    if (
      trade.stopLossPrice !== null &&
      trade.currentPrice <= trade.stopLossPrice
    ) {
      return { closeReason: "stop_loss", exitPrice: trade.stopLossPrice };
    }
    if (
      trade.takeProfitPrice !== null &&
      trade.currentPrice >= trade.takeProfitPrice
    ) {
      return { closeReason: "take_profit", exitPrice: trade.takeProfitPrice };
    }
  } else {
    if (
      trade.stopLossPrice !== null &&
      trade.currentPrice >= trade.stopLossPrice
    ) {
      return { closeReason: "stop_loss", exitPrice: trade.stopLossPrice };
    }
    if (
      trade.takeProfitPrice !== null &&
      trade.currentPrice <= trade.takeProfitPrice
    ) {
      return { closeReason: "take_profit", exitPrice: trade.takeProfitPrice };
    }
  }

  return { closeReason: "system", exitPrice: trade.currentPrice };
}

export function deriveProtectionFromActualEntry(input: {
  side: "long" | "short";
  actualEntryPrice: number;
  plannedEntryPrice: number;
  plannedStopLossPrice: number;
  plannedTakeProfitPrice: number;
}) {
  const stopDistance = Math.abs(
    input.plannedEntryPrice - input.plannedStopLossPrice,
  );
  const takeProfitDistance = Math.abs(
    input.plannedTakeProfitPrice - input.plannedEntryPrice,
  );

  return input.side === "long"
    ? {
        entryPrice: input.actualEntryPrice,
        stopLossPrice: input.actualEntryPrice - stopDistance,
        takeProfitPrice: input.actualEntryPrice + takeProfitDistance,
      }
    : {
        entryPrice: input.actualEntryPrice,
        stopLossPrice: input.actualEntryPrice + stopDistance,
        takeProfitPrice: input.actualEntryPrice - takeProfitDistance,
      };
}

export function formatProtectedPrice(value: number, tickSize: string): string {
  const fraction = tickSize.split(".")[1] ?? "";
  const decimals = fraction.length;
  return value.toFixed(decimals);
}

export function extractPacificaErrorMessage(
  body: unknown,
  fallback: string,
): string {
  const apiMessage = (body as { error?: unknown } | null)?.error;

  if (typeof apiMessage === "string" && apiMessage.trim()) {
    return apiMessage;
  }

  const rawMessage = (body as { raw?: unknown } | null)?.raw;

  if (typeof rawMessage === "string" && rawMessage.trim()) {
    return rawMessage;
  }

  return fallback;
}

function validateProtectionLevels(input: {
  side: "long" | "short";
  entryReferencePrice: number;
  stopLossPrice: number;
  takeProfitPrice: number;
}): void {
  if (input.side === "long") {
    if (input.stopLossPrice >= input.entryReferencePrice) {
      throw new Error(
        "Invalid stop loss for long trade: stop loss must be below the entry price.",
      );
    }

    if (input.takeProfitPrice <= input.entryReferencePrice) {
      throw new Error(
        "Invalid take profit for long trade: take profit must be above the entry price.",
      );
    }

    return;
  }

  if (input.stopLossPrice <= input.entryReferencePrice) {
    throw new Error(
      "Invalid stop loss for short trade: stop loss must be above the entry price.",
    );
  }

  if (input.takeProfitPrice >= input.entryReferencePrice) {
    throw new Error(
      "Invalid take profit for short trade: take profit must be below the entry price.",
    );
  }
}

function applyAdverseEntrySlippage(
  price: number,
  side: "long" | "short",
  slippagePercent: string,
): number {
  const slippageRate = Number(slippagePercent) / 100;

  if (!Number.isFinite(slippageRate) || slippageRate <= 0) {
    return price;
  }

  return side === "long"
    ? price * (1 + slippageRate)
    : price * (1 - slippageRate);
}

function alignToLastClosedCandleEndTime(
  referenceTimeMs: number,
  intervalMs: number,
): number {
  return Math.floor(referenceTimeMs / intervalMs) * intervalMs;
}

function classifyOrderExecutionFailure(error: unknown): {
  retryable: boolean;
  blocking: boolean;
  message: string;
  responseBody: unknown;
} {
  if (error instanceof PacificaApiError) {
    const status = error.details.status;

    if (status === 429 || error.details.retryable) {
      return {
        retryable: true,
        blocking: false,
        message: extractPacificaErrorMessage(error.details.body, error.message),
        responseBody: error.details.body,
      };
    }

    return {
      retryable: false,
      blocking: true,
      message: extractPacificaErrorMessage(error.details.body, error.message),
      responseBody: error.details.body,
    };
  }

  return {
    retryable: false,
    blocking: true,
    message: error instanceof Error ? error.message : String(error),
    responseBody: null as unknown,
  };
}

// ---------------------------------------------------------------------------
// Bot factory
// ---------------------------------------------------------------------------

export function createBot(input: BotInput): {
  start(): Promise<void>;
  stop(): Promise<void>;
  onStrategiesChanged(strategies: Strategy[]): void;
} {
  const logger = input.logger ?? defaultLogger;
  const { db, exchange, candleBuffer, env } = input;

  let stopped = false;
  let activeStrategies: Strategy[] = [];
  // Avaliação por candle fechado (paridade com o backtest): guarda o openTime
  // do último candle avaliado por strategy — sinal sem ordem e ordem falhada
  // NÃO reavaliam o mesmo candle
  const lastEvaluatedCandleOpenTime = new Map<string, number>();
  const decryption = new AesCredentialDecryptionService(
    env.CREDENTIAL_ENCRYPTION_KEY,
  );
  // Client assinado por wallet (credencial do usuário); invalida se a credencial trocar
  const clientCache = new Map<string, { credentialId: string; client: PacificaClient }>();
  const loggedBlockers = new Set<string>();

  // Called by DbWatcher when strategy list changes
  function onStrategiesChanged(strategies: Strategy[]): void {
    activeStrategies = strategies;
    logger.info("[bot] strategies updated", { count: strategies.length });
  }

  async function getStrategyClient(strategy: Strategy): Promise<PacificaClient> {
    const credential = await getActiveCredentialForWallet(db, strategy.userId);

    if (!credential) {
      throw new Error(
        `No active credential found for wallet of strategy ${strategy.id}.`,
      );
    }

    const cached = clientCache.get(strategy.userId);
    if (cached && cached.credentialId === credential.id) {
      return cached.client;
    }

    const privateKey = await decryption.decryptAgentWalletPrivateKey({
      encryptedPrivateKeyRef: credential.encryptedPrivateKeyRef,
    });

    const client = new PacificaClient({
      apiBaseUrl: env.PACIFICA_REST_URL,
      account: strategy.userId,
      privateKey,
      agentWallet: credential.publicKey,
      builderCode: env.PACIFICA_BUILDER_CODE,
      expiryWindowMs: env.PACIFICA_SIGNATURE_EXPIRY_WINDOW_MS,
    });

    clientCache.set(strategy.userId, { credentialId: credential.id, client });
    return client;
  }

  function materializeStrategy(strategy: Strategy): StrategyConfig | null {
    const materialized = materializeYourStrategyTechnicalContract(
      strategy.config as YourStrategyDraft,
    );

    if (!materialized.technicalContract) {
      if (!loggedBlockers.has(strategy.id)) {
        loggedBlockers.add(strategy.id);
        logger.warn("[bot] strategy not executable", {
          strategyId: strategy.id,
          blockers: materialized.activationBlockers,
        });
      }
      return null;
    }

    return materialized.technicalContract;
  }

  async function fetchAvailableBalanceUsd(
    walletAddress: string,
  ): Promise<number | null> {
    try {
      const baseUrl = env.PACIFICA_REST_URL.replace(/\/+$/, "");
      const response = await fetch(
        `${baseUrl}/api/v1/account?account=${encodeURIComponent(walletAddress)}`,
        { headers: { Accept: "application/json" } },
      );

      if (!response.ok) return null;

      const payload = (await response.json()) as {
        data?: { available_to_spend?: string };
      };
      const value = Number(payload.data?.available_to_spend);
      return Number.isFinite(value) && value > 0 ? value : null;
    } catch {
      return null;
    }
  }

  function latestBufferClose(
    marketSymbol: string,
    timeframe: string,
  ): number | null {
    const candles = candleBuffer.get(marketSymbol, timeframe as CandleInterval);
    const last = candles[candles.length - 1];
    return last ? last.close : null;
  }

  // Fill real do fechamento no histórico público da Pacifica — fonte da verdade
  // para exitPrice em vez da heurística de níveis
  async function fetchLatestCloseFill(input: {
    walletAddress: string;
    marketSymbol: string;
    tradeSide: "long" | "short";
    sinceMs: number;
  }): Promise<{ price: number } | null> {
    try {
      const baseUrl = env.PACIFICA_REST_URL.replace(/\/+$/, "");
      const response = await fetch(
        `${baseUrl}/api/v1/positions/history?account=${encodeURIComponent(input.walletAddress)}&limit=50`,
        { headers: { Accept: "application/json" } },
      );

      if (!response.ok) return null;

      const payload = (await response.json()) as {
        data?: {
          symbol?: string;
          side?: string;
          price?: string;
          created_at?: number;
        }[];
      };

      if (!Array.isArray(payload.data)) return null;

      const wantedSide = `close_${input.tradeSide}`;
      // A lista vem em ordem decrescente — o primeiro match é o fill mais recente
      for (const fill of payload.data) {
        if (
          fill.symbol === input.marketSymbol &&
          fill.side === wantedSide &&
          Number(fill.created_at) >= input.sinceMs
        ) {
          const price = Number(fill.price);
          return Number.isFinite(price) ? { price } : null;
        }
      }

      return null;
    } catch {
      return null;
    }
  }

  function classifyCloseByFillPrice(input: {
    fillPrice: number;
    stopLossPrice: number | null;
    takeProfitPrice: number | null;
  }): "stop_loss" | "take_profit" | "system" {
    const { fillPrice, stopLossPrice, takeProfitPrice } = input;

    // Tolerância relativa ao GAP entre os níveis: com stops apertados uma
    // tolerância fixa sobre o preço engloba o range inteiro e reclassifica
    // fechamentos manuais/system como SL/TP
    const levelGap =
      stopLossPrice !== null && takeProfitPrice !== null
        ? Math.abs(takeProfitPrice - stopLossPrice)
        : null;
    const tolerance = levelGap !== null ? levelGap * 0.25 : fillPrice * 0.001;

    const slDistance =
      stopLossPrice !== null
        ? Math.abs(fillPrice - stopLossPrice)
        : Number.POSITIVE_INFINITY;
    const tpDistance =
      takeProfitPrice !== null
        ? Math.abs(fillPrice - takeProfitPrice)
        : Number.POSITIVE_INFINITY;

    if (slDistance <= tpDistance && slDistance <= tolerance) {
      return "stop_loss";
    }

    if (tpDistance < slDistance && tpDistance <= tolerance) {
      return "take_profit";
    }

    return "system";
  }

  async function reconcileOpenTradesWithExchange(
    strategy: Strategy,
    tickAt: Date,
  ): Promise<void> {
    const timeframe = (strategy.config as { timeframe?: string }).timeframe ?? "";
    const openTrades = await getOpenTradesForStrategy(db, strategy.id);

    if (openTrades.length === 0) return;

    let client: PacificaClient;
    try {
      client = await getStrategyClient(strategy);
    } catch (error) {
      logger.warn("[bot] reconciliation skipped — credential unavailable", {
        strategyId: strategy.id,
        errorMessage:
          error instanceof Error ? error.message : String(error),
      });
      return;
    }

    // Fecha na exchange os trades com fechamento solicitado pelo usuário
    for (const trade of openTrades) {
      if (trade.status !== "close_requested") continue;

      const marketSymbol = toPacificaMarketSymbol(trade.symbol) ?? trade.symbol;

      try {
        await client.createMarketOrder({
          symbol: marketSymbol,
          side: trade.side === "long" ? "ask" : "bid",
          amount: trade.amount,
          slippagePercent: env.MARKET_ORDER_SLIPPAGE_PERCENT,
          clientOrderId: randomUUID(),
          reduceOnly: true,
        });
        await updateTrade(db, trade.id, { status: "closing" });
        logger.info("[bot] close order submitted", {
          strategyId: strategy.id,
          tradeId: trade.id,
          symbol: trade.symbol,
        });
      } catch (error) {
        logger.error("[bot] close order failed", {
          strategyId: strategy.id,
          tradeId: trade.id,
          errorMessage:
            error instanceof Error ? error.message : String(error),
        });
      }
    }

    let positions: Awaited<ReturnType<typeof client.getPositions>>;

    try {
      positions = await client.getPositions();
    } catch (error) {
      logger.warn("[bot] reconciliation skipped — exchange unavailable", {
        strategyId: strategy.id,
        errorMessage:
          error instanceof Error ? error.message : String(error),
      });
      return;
    }

    const closedAtIso = tickAt.toISOString();

    for (const trade of openTrades) {
      if (trade.status !== "open" && trade.status !== "closing") {
        continue;
      }

      // Grace period: posição pode demorar a aparecer após o fill — não
      // confundir com fechamento
      if (tickAt.getTime() - trade.openedAt.getTime() < 120_000) {
        continue;
      }

      const positionSide: "bid" | "ask" =
        trade.side === "long" ? "bid" : "ask";
      const marketSymbol =
        toPacificaMarketSymbol(trade.symbol) ?? trade.symbol;
      const stillOpen = positions.some(
        (p) =>
          p.symbol === marketSymbol &&
          p.side === positionSide &&
          p.entryPrice,
      );

      if (stillOpen) continue;

      const slNum = trade.sl !== null ? Number(trade.sl) : null;
      const tpNum = trade.tp !== null ? Number(trade.tp) : null;
      const entryNum = Number(trade.entryPrice);

      // Fonte da verdade: o fill real do fechamento no histórico da exchange
      const closeFill = await fetchLatestCloseFill({
        walletAddress: strategy.userId,
        marketSymbol,
        tradeSide: trade.side,
        sinceMs: trade.openedAt.getTime(),
      });

      let closeReason: "take_profit" | "stop_loss" | "manual" | "system";
      let exitPrice: number;

      if (closeFill) {
        exitPrice = closeFill.price;
        closeReason =
          trade.status === "closing"
            ? "manual"
            : classifyCloseByFillPrice({
                fillPrice: closeFill.price,
                stopLossPrice: slNum,
                takeProfitPrice: tpNum,
              });
      } else {
        // Fallback: heurística por níveis com o preço atual do buffer
        const currentPrice =
          latestBufferClose(marketSymbol, timeframe) ?? slNum ?? tpNum ?? entryNum;
        const detected = resolveDetectedClose({
          side: trade.side,
          stopLossPrice: slNum,
          takeProfitPrice: tpNum,
          currentPrice,
          closeReasonPending: trade.status === "closing" ? "manual" : null,
        });
        closeReason = detected.closeReason;
        exitPrice = detected.exitPrice;
      }

      const feeRate = env.TAKER_FEE_PERCENT / 100;
      const quantity = Number(trade.amount);
      const entryFeeUsd = entryNum * quantity * feeRate;
      const exitFeeUsd = exitPrice * quantity * feeRate;
      const realizedPnl =
        calculateUnrealizedPnl({
          side: trade.side,
          entryPrice: entryNum,
          currentPrice: exitPrice,
          quantity,
        }) -
        entryFeeUsd -
        exitFeeUsd;

      try {
        await updateTrade(db, trade.id, {
          status: "closed",
          closeReason,
          exitPrice: String(exitPrice),
          realizedPnl: String(realizedPnl),
          closedAt: new Date(closedAtIso),
        });

        await insertEvent(db, {
          strategyId: strategy.id,
          type: "trade_closed",
          payload: {
            tradeId: trade.id,
            symbol: trade.symbol,
            side: trade.side,
            closeReason,
            exitPrice,
            realizedPnl,
            detectedAtIso: closedAtIso,
          },
        });

        logger.info("[bot] trade closed by exchange", {
          strategyId: strategy.id,
          tradeId: trade.id,
          symbol: trade.symbol,
          side: trade.side,
          closeReason,
          exitPrice,
          realizedPnl,
        });
      } catch (persistError) {
        logger.error("[bot] close persistence error", {
          strategyId: strategy.id,
          tradeId: trade.id,
          errorMessage:
            persistError instanceof Error
              ? persistError.message
              : String(persistError),
        });
      }
    }
  }

  async function evaluateAndExecute(
    strategy: Strategy,
    tickAt: Date,
  ): Promise<void> {
    const config = materializeStrategy(strategy);

    if (!config) return;

    const marketSymbol = toPacificaMarketSymbol(config.symbol);

    if (!marketSymbol) {
      logger.warn("[bot] unsupported symbol", {
        strategyId: strategy.id,
        symbol: config.symbol,
      });
      return;
    }

    const interval = config.timeframe as CandleInterval;
    const requiredPeriod = getRequiredPeriod(config);
    const timeframeIntervalMs = getIntervalDurationMs(interval);
    const endTime = alignToLastClosedCandleEndTime(
      tickAt.getTime(),
      timeframeIntervalMs,
    );
    const candleLimit = Math.max(120, requiredPeriod * 5);
    const startTime = endTime - candleLimit * timeframeIntervalMs;

    // Read from CandleBuffer instead of fetching from market data directly
    const allCandles = candleBuffer.get(marketSymbol, interval);

    // Filter to the required window
    const candles = allCandles.filter(
      (c) => c.openTime >= startTime && c.closeTime <= endTime,
    );

    if (candles.length < requiredPeriod + 3) {
      logger.info("[bot] not enough candles to evaluate", {
        strategyId: strategy.id,
        symbol: config.symbol,
        available: candles.length,
        required: requiredPeriod + 3,
      });
      return;
    }

    const latestCandle = candles[candles.length - 1];

    if (!latestCandle) return;

    // Um candle fechado = uma avaliação (paridade com o backtest); marca antes
    // para que sinal sem ordem ou ordem falhada não re-tente no mesmo candle
    if (lastEvaluatedCandleOpenTime.get(strategy.id) === latestCandle.openTime) {
      return;
    }
    lastEvaluatedCandleOpenTime.set(strategy.id, latestCandle.openTime);

    const evaluation = evaluateSignal(config, candles);

    if (evaluation.signal === "none") {
      return;
    }

    // Check if already have an open trade for this symbol
    const openTrades = await getOpenTradesForStrategy(db, strategy.id);
    const hasOpenPosition = openTrades.some(
      (t) =>
        t.symbol === config.symbol &&
        (t.status === "open" ||
          t.status === "close_requested" ||
          t.status === "closing"),
    );

    if (hasOpenPosition) {
      logger.info("[bot] signal skipped — open position exists", {
        strategyId: strategy.id,
        symbol: config.symbol,
        signal: evaluation.signal,
      });
      return;
    }

    const signalSide = evaluation.signal as "long" | "short";
    const entryRefPrice = applyAdverseEntrySlippage(
      latestCandle.close,
      signalSide,
      env.MARKET_ORDER_SLIPPAGE_PERCENT,
    );

    const riskPlans = buildRiskPlans(config, evaluation.indicators, entryRefPrice);
    const riskPlan = signalSide === "long" ? riskPlans.long : riskPlans.short;

    // Sem stop válido não há ordem — invariante 3. Com stop na value area isso
    // acontece quando o preço está DENTRO dela: mercado normal, não erro.
    if (!riskPlan) {
      logger.warn("[bot] no valid stop for this side, skipping entry", {
        strategyId: strategy.id,
        side: signalSide,
        entryRefPrice,
      });
      return;
    }

    try {
      validateProtectionLevels({
        side: signalSide,
        entryReferencePrice: riskPlan.entryPrice,
        stopLossPrice: riskPlan.stopLossPrice,
        takeProfitPrice: riskPlan.takeProfitPrice,
      });
    } catch (validationError) {
      logger.warn("[bot] protection validation failed", {
        strategyId: strategy.id,
        errorMessage:
          validationError instanceof Error
            ? validationError.message
            : String(validationError),
      });
      return;
    }

    // Sizing real: percentual do saldo disponível na Pacifica
    const availableBalanceUsd = await fetchAvailableBalanceUsd(strategy.userId);

    if (availableBalanceUsd === null) {
      logger.warn("[bot] signal skipped — balance unavailable", {
        strategyId: strategy.id,
        symbol: config.symbol,
      });
      return;
    }

    const positionSizePercent = config.execution.positionSize.value;
    const targetNotionalUsd = (availableBalanceUsd * positionSizePercent) / 100;
    const side: "bid" | "ask" = signalSide === "long" ? "bid" : "ask";
    const clientOrderId = randomUUID();

    try {
      const client = await getStrategyClient(strategy);
      const marketInfoPayload = await exchange.getMarketInfo();
      const marketInfo = marketInfoPayload.find(
        (m) => m.symbol.toUpperCase() === marketSymbol.toUpperCase(),
      );

      if (!marketInfo) {
        throw new Error(
          `Market info not found for symbol: ${marketSymbol}`,
        );
      }

      const normalizedOrder = normalizeMarketOrderInput({
        symbol: marketSymbol,
        referencePrice: riskPlan.entryPrice,
        tickSize: marketInfo.tickSize,
        lotSize: marketInfo.lotSize,
        minOrderSize: marketInfo.minOrderSize,
        targetNotionalUsd,
      });

      // SL/TP inline na ordem de entrada (regra: toda ordem nasce protegida);
      // após o fill, os níveis são reancorados no preço real de entrada
      const response = await client.createMarketOrder({
        symbol: normalizedOrder.symbol,
        side,
        amount: normalizedOrder.amount,
        slippagePercent: env.MARKET_ORDER_SLIPPAGE_PERCENT,
        clientOrderId,
        takeProfit: {
          stopPrice: formatProtectedPrice(
            riskPlan.takeProfitPrice,
            marketInfo.tickSize,
          ),
        },
        stopLoss: {
          stopPrice: formatProtectedPrice(
            riskPlan.stopLossPrice,
            marketInfo.tickSize,
          ),
        },
      });

      // Wait briefly and then check for the actual position
      const positions = await client.getPositions();
      const matchingPosition = positions.find(
        (p) => p.symbol === marketSymbol && p.side === side && p.entryPrice,
      );

      const actualEntryPrice = matchingPosition?.entryPrice
        ? Number(matchingPosition.entryPrice)
        : riskPlan.entryPrice;

      const protectionPlan = deriveProtectionFromActualEntry({
        side: signalSide,
        actualEntryPrice,
        plannedEntryPrice: riskPlan.entryPrice,
        plannedStopLossPrice: riskPlan.stopLossPrice,
        plannedTakeProfitPrice: riskPlan.takeProfitPrice,
      });

      await client.setPositionTpsl({
        symbol: marketSymbol,
        side: signalSide === "long" ? "ask" : "bid",
        takeProfit: {
          stopPrice: formatProtectedPrice(
            protectionPlan.takeProfitPrice,
            marketInfo.tickSize,
          ),
        },
        stopLoss: {
          stopPrice: formatProtectedPrice(
            protectionPlan.stopLossPrice,
            marketInfo.tickSize,
          ),
        },
      });

      const quantity = Number(normalizedOrder.amount);

      await insertTrade(db, {
        strategyId: strategy.id,
        symbol: config.symbol,
        side: signalSide,
        amount: normalizedOrder.amount,
        entryPrice: String(protectionPlan.entryPrice),
        sl: String(protectionPlan.stopLossPrice),
        tp: String(protectionPlan.takeProfitPrice),
        status: "open",
        clientOrderId,
        openedAt: tickAt,
      });

      await insertEvent(db, {
        strategyId: strategy.id,
        type: "trade_opened",
        payload: {
          signal: evaluation.signal,
          clientOrderId,
          marketSymbol,
          side: signalSide,
          entryPrice: protectionPlan.entryPrice,
          sl: protectionPlan.stopLossPrice,
          tp: protectionPlan.takeProfitPrice,
          quantity,
          response,
        },
      });

      logger.info("[bot] order submitted", {
        strategyId: strategy.id,
        symbol: config.symbol,
        marketSymbol,
        side: signalSide,
        clientOrderId,
        entryPrice: protectionPlan.entryPrice,
        sl: protectionPlan.stopLossPrice,
        tp: protectionPlan.takeProfitPrice,
      });
    } catch (error) {
      const failure = classifyOrderExecutionFailure(error);

      await insertEvent(db, {
        strategyId: strategy.id,
        type: "order_failed",
        payload: {
          signal: evaluation.signal,
          clientOrderId,
          errorMessage: failure.message,
          retryable: failure.retryable,
          responseBody: failure.responseBody,
        },
      });

      logger.error("[bot] order execution error", {
        strategyId: strategy.id,
        symbol: config.symbol,
        clientOrderId,
        errorMessage: failure.message,
        retryable: failure.retryable,
      });
    }
  }

  async function tick(): Promise<void> {
    const tickAt = new Date();
    const strategies = activeStrategies.slice();

    for (const strategy of strategies) {
      try {
        await reconcileOpenTradesWithExchange(strategy, tickAt);
        await evaluateAndExecute(strategy, tickAt);
      } catch (error) {
        const errorMessage =
          error instanceof PacificaApiError
            ? extractPacificaErrorMessage(error.details.body, error.message)
            : error instanceof Error
              ? error.message
              : "Unknown bot error";

        logger.error("[bot] tick error", {
          strategyId: strategy.id,
          errorMessage,
        });
      }
    }
  }

  let tickTimer: ReturnType<typeof setTimeout> | null = null;

  function scheduleTick(): void {
    if (stopped) return;
    tickTimer = setTimeout(() => {
      void tick().finally(() => {
        scheduleTick();
      });
    }, env.HEARTBEAT_INTERVAL_MS);
  }

  return {
    async start(): Promise<void> {
      stopped = false;
      logger.info("[bot] starting");

      // Load initial strategies
      try {
        activeStrategies = await getActiveStrategies(db);
        logger.info("[bot] initial strategies loaded", {
          count: activeStrategies.length,
        });
      } catch (err) {
        logger.error("[bot] failed to load initial strategies", err);
      }

      scheduleTick();
    },

    async stop(): Promise<void> {
      stopped = true;
      if (tickTimer !== null) {
        clearTimeout(tickTimer);
        tickTimer = null;
      }
      logger.info("[bot] stopped");
    },

    onStrategiesChanged,
  };
}
