import { createServer } from "node:http";
import type { IncomingMessage, ServerResponse } from "node:http";
import { PrismaClient } from "@prisma/client";
import { createApiModule } from "./createApiModule";
import {
  readLocalMarketDataRefreshSchedulerConfigFromEnv,
  startLocalMarketDataRefreshScheduler,
} from "./infrastructure/market-data/startLocalMarketDataRefreshScheduler";

const prisma = new PrismaClient();
const api = createApiModule({
  environment: {
    pacificaRestBaseUrl:
      process.env.PACIFICA_REST_BASE_URL ?? "https://api.pacifica.fi",
    pacificaSignatureExpiryWindowMs: Number(
      process.env.PACIFICA_SIGNATURE_EXPIRY_WINDOW_MS ?? "30000",
    ),
    pacificaBuilderCode: process.env.PACIFICA_BUILDER_CODE ?? "",
    pacificaBuilderMaxFeeRate:
      process.env.PACIFICA_BUILDER_MAX_FEE_RATE ?? "",
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
    credentialEncryptionKey: process.env.CREDENTIAL_ENCRYPTION_KEY ?? "",
    credentialEncryptionKeyId:
      process.env.CREDENTIAL_ENCRYPTION_KEY_ID ?? "local-dev-v1",
  },
  prisma,
});
const localMarketDataRefreshScheduler = startLocalMarketDataRefreshScheduler({
  config: readLocalMarketDataRefreshSchedulerConfigFromEnv(process.env),
  refreshMarketData: api.services.refreshMarketData,
});

const port = Number(process.env.PORT ?? "3003");
const allowedOrigin =
  process.env.APP_ORIGIN ??
  process.env.VITE_APP_API_BASE_URL?.replace(/:\d+$/, ":5173") ??
  "http://localhost:5173";

const server = createServer(async (request: IncomingMessage, response: ServerResponse) => {
  applyCorsHeaders(response);

  if (request.method === "OPTIONS") {
    response.writeHead(204);
    response.end();
    return;
  }

  if (
    request.method === "POST" &&
    request.url === "/api/onboarding/builder/approve"
  ) {
    const body = await readJsonBody(request);
    const result = await api.router.approvePacificaBuilder({
      body: body as never,
    });

    response.writeHead(result.canProceed ? 200 : 400, {
      "Content-Type": "application/json",
    });
    response.end(JSON.stringify(result));
    return;
  }

  if (
    request.method === "POST" &&
    request.url === "/api/strategies/your/activate"
  ) {
    const body = await readJsonBody(request);
    const result = await api.router.activateYourStrategy({
      body: body as never,
    });

    response.writeHead(result.status === "success" ? 200 : 400, {
      "Content-Type": "application/json",
    });
    response.end(JSON.stringify(result));
    return;
  }

  if (
    request.method === "POST" &&
    request.url === "/api/runtime/pause"
  ) {
    const body = await readJsonBody(request);
    const result = await api.router.pauseBot({
      body: body as never,
    });

    response.writeHead(result.status === "success" ? 200 : 400, {
      "Content-Type": "application/json",
    });
    response.end(JSON.stringify(result));
    return;
  }

  if (
    request.method === "POST" &&
    request.url === "/api/runtime/heartbeat"
  ) {
    const body = await readJsonBody(request);
    const result = await api.router.heartbeatRuntime({
      body: body as never,
    });

    response.writeHead(result.status === "success" ? 200 : 400, {
      "Content-Type": "application/json",
    });
    response.end(JSON.stringify(result));
    return;
  }

  if (
    request.method === "POST" &&
    request.url === "/api/runtime/reconcile"
  ) {
    const body = await readJsonBody(request);
    const result = await api.router.reconcileRuntime({
      body: body as never,
    });

    response.writeHead(result.status === "success" ? 200 : 400, {
      "Content-Type": "application/json",
    });
    response.end(JSON.stringify(result));
    return;
  }

  if (
    request.method === "POST" &&
    request.url === "/api/runtime/resume"
  ) {
    const body = await readJsonBody(request);
    const result = await api.router.resumeBot({
      body: body as never,
    });

    response.writeHead(result.status === "success" ? 200 : 400, {
      "Content-Type": "application/json",
    });
    response.end(JSON.stringify(result));
    return;
  }

  if (
    request.method === "POST" &&
    /^\/api\/trades\/[^/]+\/close$/.test(request.url ?? "")
  ) {
    const tradeId = request.url?.split("/")[3] ?? "";
    const body = await readJsonBody(request);
    const result = await api.router.closeTrade({
      body: {
        ...(body as Record<string, unknown>),
        tradeId,
      } as never,
    });

    response.writeHead(result.status === "success" ? 200 : 400, {
      "Content-Type": "application/json",
    });
    response.end(JSON.stringify(result));
    return;
  }

  if (
    request.method === "POST" &&
    request.url === "/api/strategies/your/save"
  ) {
    const body = await readJsonBody(request);
    const result = await api.router.saveYourStrategy({
      body: body as never,
    });

    response.writeHead(result.status === "success" ? 200 : 400, {
      "Content-Type": "application/json",
    });
    response.end(JSON.stringify(result));
    return;
  }

  if (
    request.method === "POST" &&
    request.url === "/api/strategies/your/backtest-preview"
  ) {
    const body = await readJsonBody(request);
    const result = await api.router.previewYourStrategyBacktest({
      body: body as never,
    });

    response.writeHead(result.status === "success" ? 200 : 400, {
      "Content-Type": "application/json",
    });
    response.end(JSON.stringify(result));
    return;
  }

  if (
    request.method === "POST" &&
    request.url === "/api/market/candles"
  ) {
    const body = await readJsonBody(request);
    const result = await api.router.getMarketCandles({
      body: body as never,
    });

    response.writeHead(result.status === "success" ? 200 : 400, {
      "Content-Type": "application/json",
    });
    response.end(JSON.stringify(result));
    return;
  }

  if (
    request.method === "GET" &&
    request.url === "/api/market/prices"
  ) {
    const result = await api.router.getMarketPrices();

    response.writeHead(result.status === "success" ? 200 : 400, {
      "Content-Type": "application/json",
    });
    response.end(JSON.stringify(result));
    return;
  }

  if (
    request.method === "POST" &&
    request.url === "/api/internal/market/refresh"
  ) {
    const body = await readJsonBody(request);
    const result = await api.router.refreshMarketData({
      body: body as never,
    });

    response.writeHead(200, {
      "Content-Type": "application/json",
    });
    response.end(JSON.stringify(result));
    return;
  }

  if (
    request.method === "POST" &&
    request.url === "/api/onboarding/account/lookup"
  ) {
    const body = await readJsonBody(request);
    const result = await api.router.lookupOperationalAccountByWallet({
      body: body as never,
    });

    response.writeHead(result.status === "error" ? 500 : 200, {
      "Content-Type": "application/json",
    });
    response.end(JSON.stringify(result));
    return;
  }

  if (
    request.method === "POST" &&
    request.url === "/api/account/session"
  ) {
    const body = await readJsonBody(request);
    const result = await api.router.getOperationalSessionByWallet({
      body: body as never,
    });

    response.writeHead(result.status === "error" ? 500 : 200, {
      "Content-Type": "application/json",
    });
    response.end(JSON.stringify(result));
    return;
  }

  if (
    request.method === "POST" &&
    request.url === "/api/account/profile"
  ) {
    const body = await readJsonBody(request);
    const result = await api.router.getOperationalProfileByWallet({
      body: body as never,
    });

    response.writeHead(result.status === "error" ? 500 : 200, {
      "Content-Type": "application/json",
    });
    response.end(JSON.stringify(result));
    return;
  }

  if (
    request.method === "POST" &&
    request.url === "/api/account/dashboard"
  ) {
    const body = await readJsonBody(request);
    const result = await api.router.getOperationalDashboardByWallet({
      body: body as never,
    });

    response.writeHead(result.status === "error" ? 500 : 200, {
      "Content-Type": "application/json",
    });
    response.end(JSON.stringify(result));
    return;
  }

  if (
    request.method === "POST" &&
    request.url === "/api/account/presets"
  ) {
    const body = await readJsonBody(request);
    const result = await api.router.getOperationalPresetsByWallet({
      body: body as never,
    });

    response.writeHead(result.status === "error" ? 500 : 200, {
      "Content-Type": "application/json",
    });
    response.end(JSON.stringify(result));
    return;
  }

  if (
    request.method === "POST" &&
    request.url === "/api/account/trades"
  ) {
    const body = await readJsonBody(request);
    const result = await api.router.getOperationalTradesByWallet({
      body: body as never,
    });

    response.writeHead(result.status === "error" ? 500 : 200, {
      "Content-Type": "application/json",
    });
    response.end(JSON.stringify(result));
    return;
  }

  if (
    request.method === "POST" &&
    request.url === "/api/account/history"
  ) {
    const body = await readJsonBody(request);
    const result = await api.router.getOperationalHistoryByWallet({
      body: body as never,
    });

    response.writeHead(result.status === "error" ? 500 : 200, {
      "Content-Type": "application/json",
    });
    response.end(JSON.stringify(result));
    return;
  }

  if (
    request.method === "POST" &&
    request.url === "/api/onboarding/credentials/validate"
  ) {
    const body = await readJsonBody(request);
    const result = await api.router.validatePacificaCredentials({
      body: body as never,
    });

    response.writeHead(result.canProceed ? 200 : 400, {
      "Content-Type": "application/json",
    });
    response.end(JSON.stringify(result));
    return;
  }

  if (
    request.method === "POST" &&
    request.url === "/api/onboarding/credentials/verify-operational"
  ) {
    const body = await readJsonBody(request);
    const result = await api.router.verifyPacificaOperational({
      body: body as never,
    });

    response.writeHead(result.canProceed ? 200 : 400, {
      "Content-Type": "application/json",
    });
    response.end(JSON.stringify(result));
    return;
  }

  response.writeHead(404, { "Content-Type": "application/json" });
  response.end(JSON.stringify({ message: "Not found" }));
});

server.listen(port, () => {
  console.log(`Pacifica API listening on http://localhost:${port}`);
});

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => {
    localMarketDataRefreshScheduler.stop();
  });
}

function applyCorsHeaders(response: ServerResponse) {
  response.setHeader("Access-Control-Allow-Origin", allowedOrigin);
  response.setHeader("Vary", "Origin");
  response.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

async function readJsonBody(
  request: IncomingMessage,
): Promise<unknown> {
  const chunks: Buffer[] = [];

  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  if (chunks.length === 0) {
    return {};
  }

  return JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown;
}
