// ---------------------------------------------------------------------------
// Worker environment configuration
// Validates required env vars at startup and provides typed access.
// ---------------------------------------------------------------------------

export type WorkerEnv = {
  DATABASE_URL: string;
  PACIFICA_REST_URL: string;
  PACIFICA_BUILDER_CODE: string;
  CREDENTIAL_ENCRYPTION_KEY: string;
  CREDENTIAL_ENCRYPTION_KEY_ID: string;
  MARKET_ORDER_SLIPPAGE_PERCENT: string;
  TAKER_FEE_PERCENT: number;
  SIGNAL_TRACE_ENABLED: boolean;
  PACIFICA_SIGNATURE_EXPIRY_WINDOW_MS: number;
};

function requireNonEmpty(value: string | undefined, name: string): string {
  if (!value?.trim()) {
    throw new Error(`FATAL: ${name} is required and cannot be empty`);
  }
  return value;
}

function requireMinLength(
  value: string | undefined,
  name: string,
  minLength: number,
): string {
  const nonEmpty = requireNonEmpty(value, name);
  if (nonEmpty.length < minLength) {
    throw new Error(
      `FATAL: ${name} must be at least ${minLength} characters long`,
    );
  }
  return nonEmpty;
}

function positiveNumberOrDefault(
  rawValue: string | undefined,
  fallback: number,
): number {
  const parsed = rawValue ? Number(rawValue) : Number.NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function booleanFromEnv(
  rawValue: string | undefined,
  fallback: boolean,
): boolean {
  if (!rawValue) return fallback;
  const normalized = rawValue.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  return fallback;
}

export function loadWorkerEnv(): WorkerEnv {
  const env: WorkerEnv = {
    DATABASE_URL: requireNonEmpty(process.env.DATABASE_URL, "DATABASE_URL"),
    PACIFICA_REST_URL:
      process.env.PACIFICA_REST_URL ?? "https://api.pacifica.fi",
    PACIFICA_BUILDER_CODE: requireNonEmpty(
      process.env.PACIFICA_BUILDER_CODE,
      "PACIFICA_BUILDER_CODE",
    ),
    CREDENTIAL_ENCRYPTION_KEY: requireMinLength(
      process.env.CREDENTIAL_ENCRYPTION_KEY,
      "CREDENTIAL_ENCRYPTION_KEY",
      32,
    ),
    CREDENTIAL_ENCRYPTION_KEY_ID:
      process.env.CREDENTIAL_ENCRYPTION_KEY_ID ?? "local-dev-v1",
    MARKET_ORDER_SLIPPAGE_PERCENT:
      process.env.MARKET_ORDER_SLIPPAGE_PERCENT ?? "0.5",
    TAKER_FEE_PERCENT: positiveNumberOrDefault(
      process.env.TAKER_FEE_PERCENT,
      0.05,
    ),
    SIGNAL_TRACE_ENABLED: booleanFromEnv(
      process.env.SIGNAL_TRACE_ENABLED,
      false,
    ),
    PACIFICA_SIGNATURE_EXPIRY_WINDOW_MS: positiveNumberOrDefault(
      process.env.PACIFICA_SIGNATURE_EXPIRY_WINDOW_MS,
      30_000,
    ),
  };

  if (process.env.NODE_ENV === "production" && env.SIGNAL_TRACE_ENABLED) {
    console.warn(
      "[SECURITY] SIGNAL_TRACE_ENABLED=true in production. " +
        "Sensitive financial data (positions, candles, indicators) will be logged.",
    );
  }

  return env;
}
