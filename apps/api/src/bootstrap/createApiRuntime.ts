import { PrismaClient } from "@prisma/client";
import { createApiModule } from "../createApiModule";

const REQUIRED_ENV_VARS = [
  "CREDENTIAL_ENCRYPTION_KEY",
  "PACIFICA_BUILDER_CODE",
  "INTERNAL_API_SECRET",
] as const;

function validateRequiredEnvVars(): void {
  for (const key of REQUIRED_ENV_VARS) {
    if (!process.env[key]?.trim()) {
      throw new Error(
        `FATAL: environment variable ${key} is required but absent or empty`,
      );
    }
  }
}

type ApiRuntime = {
  api: ReturnType<typeof createApiModule>;
  prisma: PrismaClient;
  internalApiSecret: string;
  allowedOrigin: string;
};

let cachedRuntime: ApiRuntime | null = null;

export function getApiRuntime(): ApiRuntime {
  if (cachedRuntime) return cachedRuntime;

  validateRequiredEnvVars();

  const prisma = new PrismaClient();
  const api = createApiModule({
    environment: {
      pacificaRestBaseUrl:
        process.env.PACIFICA_REST_BASE_URL ?? "https://api.pacifica.fi",
      pacificaSignatureExpiryWindowMs: Number(
        process.env.PACIFICA_SIGNATURE_EXPIRY_WINDOW_MS ?? "30000",
      ),
      pacificaBuilderCode: process.env.PACIFICA_BUILDER_CODE!,
      pacificaBuilderMaxFeeRate: process.env.PACIFICA_BUILDER_MAX_FEE_RATE ?? "",
      pacificaOperationalProbeSymbol:
        process.env.PACIFICA_OPERATIONAL_PROBE_SYMBOL ?? "BTC",
      pacificaOperationalProbePrice:
        process.env.PACIFICA_OPERATIONAL_PROBE_PRICE ?? "20000",
      pacificaOperationalProbeTargetNotionalUsd:
        process.env.PACIFICA_OPERATIONAL_PROBE_TARGET_NOTIONAL_USD ?? "11",
      pacificaOperationalProbeTif:
        (process.env.PACIFICA_OPERATIONAL_PROBE_TIF as
          | "ALO"
          | "GTC"
          | "IOC"
          | undefined) ?? "ALO",
      credentialEncryptionKey: process.env.CREDENTIAL_ENCRYPTION_KEY!,
      credentialEncryptionKeyId:
        process.env.CREDENTIAL_ENCRYPTION_KEY_ID ?? "local-dev-v1",
    },
    prisma,
  });

  cachedRuntime = {
    api,
    prisma,
    internalApiSecret: process.env.INTERNAL_API_SECRET!,
    allowedOrigin:
      process.env.APP_ORIGIN ??
      process.env.VITE_APP_API_BASE_URL?.replace(/:\d+$/, ":5173") ??
      "http://localhost:5173",
  };

  return cachedRuntime;
}
