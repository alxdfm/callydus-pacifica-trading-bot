export type WorkerEnvironment = {
  workerId: string;
  scanIntervalMs: number;
  heartbeatIntervalMs: number;
  leaseDurationMs: number;
  maxBackoffMs: number;
};

/**
 * Creates the runtime configuration for the operational worker loop.
 *
 * Responsibility:
 * - centralize defaults for scan cadence, heartbeat cadence and lease duration
 * - keep worker identity explicit so persisted ownership can be audited
 *
 * Non-responsibility:
 * - it does not read process environment directly
 */
export function createWorkerEnvironment(
  input: Partial<WorkerEnvironment> = {},
): WorkerEnvironment {
  return {
    workerId: input.workerId ?? `worker-local-${process.pid}`,
    scanIntervalMs: input.scanIntervalMs ?? 5_000,
    heartbeatIntervalMs: input.heartbeatIntervalMs ?? 15_000,
    leaseDurationMs: input.leaseDurationMs ?? 45_000,
    maxBackoffMs: input.maxBackoffMs ?? 30_000,
  };
}
