import { cors } from "hono/cors";

// appOrigin aceita múltiplas origens separadas por vírgula
// (ex.: "https://trade.callydus.xyz,http://localhost:5173")
export function createCorsMiddleware(appOrigin: string) {
  const allowedOrigins = appOrigin
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  return cors({ origin: allowedOrigins, credentials: true });
}
