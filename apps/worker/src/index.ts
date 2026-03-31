import { PrismaClient } from "@prisma/client";
import { createOperationalWorker } from "./application/createOperationalWorker";
import { createWorkerEnvironment } from "./infrastructure/config/createWorkerEnvironment";
import { PrismaWorkerRuntimeRepository } from "./infrastructure/persistence/PrismaWorkerRuntimeRepository";

const prisma = new PrismaClient();
const environment = createWorkerEnvironment({
  ...(process.env.WORKER_ID ? { workerId: process.env.WORKER_ID } : {}),
  scanIntervalMs: numberFromEnv(process.env.WORKER_SCAN_INTERVAL_MS, 5_000),
  heartbeatIntervalMs: numberFromEnv(
    process.env.WORKER_HEARTBEAT_INTERVAL_MS,
    15_000,
  ),
  leaseDurationMs: numberFromEnv(process.env.WORKER_LEASE_DURATION_MS, 45_000),
  maxBackoffMs: numberFromEnv(process.env.WORKER_MAX_BACKOFF_MS, 30_000),
});
const worker = createOperationalWorker({
  environment,
  repository: new PrismaWorkerRuntimeRepository(prisma),
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
  console.error("worker.unhandled_rejection", {
    workerId: environment.workerId,
    reason: reason instanceof Error ? reason.message : String(reason),
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

function numberFromEnv(rawValue: string | undefined, fallback: number) {
  const parsed = rawValue ? Number(rawValue) : Number.NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
