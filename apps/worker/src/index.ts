import { PrismaClient } from "@prisma/client";
import { AesCredentialEncryptionService } from "@pacifica/credential-crypto";
import { PacificaMarketDataGateway } from "@pacifica/pacifica-market-data";
import { createOperationalWorker } from "./application/createOperationalWorker";
import { createWorkerEnvironment } from "./infrastructure/config/createWorkerEnvironment";
import { PersistedWorkerMarketDataGateway } from "./infrastructure/market-data/PersistedWorkerMarketDataGateway";
import { PrismaWorkerRuntimeRepository } from "./infrastructure/persistence/PrismaWorkerRuntimeRepository";

const REQUIRED_ENV_VARS = ["CREDENTIAL_ENCRYPTION_KEY", "PACIFICA_BUILDER_CODE"] as const;
for (const key of REQUIRED_ENV_VARS) {
  if (!process.env[key]?.trim()) {
    process.stderr.write(`FATAL: environment variable ${key} is required but absent or empty\n`);
    process.exit(1);
  }
}

const prisma = new PrismaClient();
const environment = createWorkerEnvironment({
  ...(process.env.WORKER_ID ? { workerId: process.env.WORKER_ID } : {}),
  ...(process.env.PACIFICA_REST_BASE_URL
    ? { pacificaRestBaseUrl: process.env.PACIFICA_REST_BASE_URL }
    : {}),
  pacificaSignatureExpiryWindowMs: numberFromEnv(
    process.env.PACIFICA_SIGNATURE_EXPIRY_WINDOW_MS,
    30_000,
  ),
  ...(process.env.PACIFICA_BUILDER_CODE
    ? { pacificaBuilderCode: process.env.PACIFICA_BUILDER_CODE }
    : {}),
  ...(process.env.CREDENTIAL_ENCRYPTION_KEY
    ? { credentialEncryptionKey: process.env.CREDENTIAL_ENCRYPTION_KEY }
    : {}),
  ...(process.env.CREDENTIAL_ENCRYPTION_KEY_ID
    ? { credentialEncryptionKeyId: process.env.CREDENTIAL_ENCRYPTION_KEY_ID }
    : {}),
  ...(process.env.WORKER_MARKET_ORDER_SLIPPAGE_PERCENT
    ? { marketOrderSlippagePercent: process.env.WORKER_MARKET_ORDER_SLIPPAGE_PERCENT }
    : {}),
  takerFeePercent: numberFromEnv(process.env.WORKER_TAKER_FEE_PERCENT, 0.05),
  signalTraceEnabled: booleanFromEnv(
    process.env.WORKER_SIGNAL_TRACE_ENABLED,
    false,
  ),
  scanIntervalMs: numberFromEnv(process.env.WORKER_SCAN_INTERVAL_MS, 5_000),
  heartbeatIntervalMs: numberFromEnv(
    process.env.WORKER_HEARTBEAT_INTERVAL_MS,
    15_000,
  ),
  analysisIntervalMs: numberFromEnv(
    process.env.WORKER_ANALYSIS_INTERVAL_MS,
    60_000,
  ),
  leaseDurationMs: numberFromEnv(process.env.WORKER_LEASE_DURATION_MS, 45_000),
  maxBackoffMs: numberFromEnv(process.env.WORKER_MAX_BACKOFF_MS, 30_000),
});
const worker = createOperationalWorker({
  environment,
  repository: new PrismaWorkerRuntimeRepository(prisma),
  marketData: new PersistedWorkerMarketDataGateway(
    prisma,
    new PacificaMarketDataGateway({
      pacificaRestBaseUrl: environment.pacificaRestBaseUrl,
    }),
  ),
  credentialEncryption: new AesCredentialEncryptionService(
    environment.credentialEncryptionKey,
    environment.credentialEncryptionKeyId,
  ),
});

void worker.start();

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.once(signal, () => {
    void shutdown(signal);
  });
}

process.once("uncaughtException", (error) => {
  console.error("worker.uncaught_exception", {
    workerId: environment.workerId,
    errorMessage: error.message,
  });
  void shutdown("uncaughtException");
});

process.once("unhandledRejection", (reason) => {
  const rawMessage = reason instanceof Error ? reason.message : String(reason);
  console.error("worker.unhandled_rejection", {
    workerId: environment.workerId,
    reason: sanitizeForLog(rawMessage),
  });
  void shutdown("unhandledRejection");
});

/**
 * Performs best-effort worker shutdown and database cleanup.
 */
async function shutdown(reason: string) {
  console.info("worker.shutdown_requested", {
    workerId: environment.workerId,
    reason,
  });
  await worker.stop();
  await prisma.$disconnect();
  process.exit(0);
}

function sanitizeForLog(message: string): string {
  // Redact strings that look like private keys (base58, 64+ chars)
  return message.replace(/[1-9A-HJ-NP-Za-km-z]{64,}/g, "[REDACTED]");
}

function numberFromEnv(rawValue: string | undefined, fallback: number) {
  const parsed = rawValue ? Number(rawValue) : Number.NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function booleanFromEnv(rawValue: string | undefined, fallback: boolean) {
  if (!rawValue) {
    return fallback;
  }

  const normalized = rawValue.trim().toLowerCase();

  if (["1", "true", "yes", "on"].includes(normalized)) {
    return true;
  }

  if (["0", "false", "no", "off"].includes(normalized)) {
    return false;
  }

  return fallback;
}
