import { cors } from "hono/cors";

export function createCorsMiddleware(allowedOrigin: string) {
  return cors({ origin: allowedOrigin, credentials: true });
}
