import { createServer } from "node:http";
import type { IncomingMessage, ServerResponse } from "node:http";
import { getApiRuntime } from "./bootstrap/createApiRuntime";
import { createApiHttpHandler } from "./ui/http/createApiHttpHandler";
import {
  readLocalMarketDataRefreshSchedulerConfigFromEnv,
  startLocalMarketDataRefreshScheduler,
} from "./infrastructure/market-data/startLocalMarketDataRefreshScheduler";

const REQUIRED_ENV_VARS = [
  "CREDENTIAL_ENCRYPTION_KEY",
  "PACIFICA_BUILDER_CODE",
  "INTERNAL_API_SECRET",
] as const;
for (const key of REQUIRED_ENV_VARS) {
  if (!process.env[key]?.trim()) {
    process.stderr.write(
      `FATAL: environment variable ${key} is required but absent or empty\n`,
    );
    process.exit(1);
  }
}

const { api, internalApiSecret, allowedOrigin } = getApiRuntime();

const handleRequest = createApiHttpHandler(api, { internalApiSecret });

const SCHEDULER_CANDLE_SYMBOLS = ["BTC-PERP", "ETH-PERP", "SOL-PERP"] as const;
const SCHEDULER_CANDLE_INTERVALS = ["5m", "15m", "1h"] as const;

// Limits chosen to cover 7-day backtest window + 30-candle warmup with buffer
const SCHEDULER_CANDLE_INTERVAL_LIMITS: Record<(typeof SCHEDULER_CANDLE_INTERVALS)[number], number> = {
  "5m": 2100,
  "15m": 750,
  "1h": 220,
};

const localMarketDataRefreshScheduler = startLocalMarketDataRefreshScheduler({
  config: readLocalMarketDataRefreshSchedulerConfigFromEnv(process.env),
  refreshMarketData: api.services.refreshMarketData,
  resolveCandleRequests: async () =>
    SCHEDULER_CANDLE_SYMBOLS.flatMap((symbol) =>
      SCHEDULER_CANDLE_INTERVALS.map((interval) => ({
        symbol,
        interval,
        priceSource: "market" as const,
        limit: SCHEDULER_CANDLE_INTERVAL_LIMITS[interval],
      })),
    ),
});

const port = Number(process.env.PORT ?? "3003");

const server = createServer(
  async (request: IncomingMessage, response: ServerResponse) => {
    const requestOrigin = request.headers["origin"];
    applyCorsHeaders(requestOrigin, response);

    if (request.method === "OPTIONS") {
      if (requestOrigin !== allowedOrigin) {
        response.writeHead(403);
        response.end();
        return;
      }
      response.writeHead(204);
      response.end();
      return;
    }

    const rawBody = await readRawBody(request);

    const headers: Record<string, string | undefined> = {};
    for (const [key, value] of Object.entries(request.headers)) {
      headers[key.toLowerCase()] = Array.isArray(value) ? value[0] : value;
    }

    const url = new URL(request.url ?? "/", `http://localhost`);

    const apiResponse = await handleRequest({
      method: request.method ?? "GET",
      path: url.pathname,
      headers,
      queryStringParameters: Object.fromEntries(url.searchParams.entries()),
      rawBody: rawBody || null,
    });

    response.writeHead(apiResponse.statusCode, apiResponse.headers);
    response.end(apiResponse.body);
  },
);

server.listen(port, () => {
  console.log(`Pacifica API listening on http://localhost:${port}`);
});

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => {
    localMarketDataRefreshScheduler.stop();
  });
}

process.once("unhandledRejection", (reason) => {
  const rawMessage = reason instanceof Error ? reason.message : String(reason);
  process.stderr.write(
    `api.unhandled_rejection: ${sanitizeForLog(rawMessage)}\n`,
  );
});

function applyCorsHeaders(
  requestOrigin: string | undefined,
  response: ServerResponse,
) {
  if (requestOrigin === allowedOrigin) {
    response.setHeader("Access-Control-Allow-Origin", allowedOrigin);
    response.setHeader("Vary", "Origin");
    response.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    response.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization",
    );
  }
}

async function readRawBody(request: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString("utf8");
}

function sanitizeForLog(message: string): string {
  return message.replace(/[1-9A-HJ-NP-Za-km-z]{64,}/g, "[REDACTED]");
}
