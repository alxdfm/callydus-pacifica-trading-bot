import { z } from "zod";

const pacificaTifSchema = z.enum(["ALO", "GTC", "IOC"]);

const apiEnvSchema = z.object({
  DATABASE_URL: z.string().min(1),
  PACIFICA_REST_BASE_URL: z.string().default("https://api.pacifica.fi"),
  PACIFICA_SIGNATURE_EXPIRY_WINDOW_MS: z
    .string()
    .transform(Number)
    .default("30000"),
  PACIFICA_BUILDER_CODE: z.string().min(1),
  PACIFICA_BUILDER_MAX_FEE_RATE: z.string().default(""),
  PACIFICA_OPERATIONAL_PROBE_SYMBOL: z.string().default("BTC"),
  PACIFICA_OPERATIONAL_PROBE_PRICE: z.string().default("20000"),
  PACIFICA_OPERATIONAL_PROBE_TARGET_NOTIONAL_USD: z.string().default("11"),
  PACIFICA_OPERATIONAL_PROBE_TIF: pacificaTifSchema.default("ALO"),
  CREDENTIAL_ENCRYPTION_KEY: z.string().min(1),
  CREDENTIAL_ENCRYPTION_KEY_ID: z.string().default("local-dev-v1"),
  APP_ORIGIN: z.string().default("http://localhost:5173"),
  PORT: z.string().transform(Number).default("3003"),
});

export type ApiEnv = z.infer<typeof apiEnvSchema>;

export function loadApiEnv(): ApiEnv {
  return apiEnvSchema.parse(process.env);
}
