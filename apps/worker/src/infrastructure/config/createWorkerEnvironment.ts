export type WorkerEnvironment = {
  workerId: string;
  pacificaRestBaseUrl: string;
  pacificaSignatureExpiryWindowMs: number;
  pacificaBuilderCode: string;
  credentialEncryptionKey: string;
  credentialEncryptionKeyId: string;
  marketOrderSlippagePercent: string;
  takerFeePercent: number;
  signalTraceEnabled: boolean;
  scanIntervalMs: number;
  heartbeatIntervalMs: number;
  analysisIntervalMs: number;
  leaseDurationMs: number;
  maxBackoffMs: number;
};

function requireNonEmpty(value: string | undefined, name: string): string {
  if (!value?.trim()) {
    throw new Error(`FATAL: ${name} is required and cannot be empty`);
  }
  return value;
}

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
    pacificaRestBaseUrl:
      input.pacificaRestBaseUrl ?? "https://api.pacifica.fi",
    pacificaSignatureExpiryWindowMs:
      input.pacificaSignatureExpiryWindowMs ?? 30000,
    pacificaBuilderCode: requireNonEmpty(input.pacificaBuilderCode, "pacificaBuilderCode"),
    credentialEncryptionKey: requireNonEmpty(input.credentialEncryptionKey, "credentialEncryptionKey"),
    credentialEncryptionKeyId: input.credentialEncryptionKeyId ?? "local-dev-v1",
    marketOrderSlippagePercent: input.marketOrderSlippagePercent ?? "0.5",
    takerFeePercent: input.takerFeePercent ?? 0.05,
    signalTraceEnabled: input.signalTraceEnabled ?? false,
    scanIntervalMs: input.scanIntervalMs ?? 5_000,
    heartbeatIntervalMs: input.heartbeatIntervalMs ?? 15_000,
    analysisIntervalMs: input.analysisIntervalMs ?? 60_000,
    leaseDurationMs: input.leaseDurationMs ?? 45_000,
    maxBackoffMs: input.maxBackoffMs ?? 30_000,
  };
}
