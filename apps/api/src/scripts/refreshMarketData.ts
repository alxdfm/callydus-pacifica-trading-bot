import { PrismaClient } from "@prisma/client";
import { createApiModule } from "../createApiModule";
import { createActivePresetMarketDataRequestResolver } from "../infrastructure/market-data/ActivePresetMarketDataRequestResolver";
import { normalizeCandleRequestConfig } from "../infrastructure/market-data/startLocalMarketDataRefreshScheduler";

const prisma = new PrismaClient();

async function main() {
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
      pacificaAccountPrivateKey:
        process.env.PACIFICA_ACCOUNT_PRIVATE_KEY ?? "",
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
  const resolveActivePresetMarketDataRequests =
    createActivePresetMarketDataRequestResolver({
      prisma,
    });

  const symbol = process.env.MARKET_REFRESH_SYMBOL;
  const interval = process.env.MARKET_REFRESH_INTERVAL as
    | "1m"
    | "3m"
    | "5m"
    | "15m"
    | "30m"
    | "1h"
    | "2h"
    | "4h"
    | "6h"
    | "12h"
    | "1d"
    | undefined;
  const priceSource =
    (process.env.MARKET_REFRESH_PRICE_SOURCE as "market" | "mark" | undefined) ??
    "market";
  const startTime = process.env.MARKET_REFRESH_START_TIME
    ? Number(process.env.MARKET_REFRESH_START_TIME)
    : undefined;
  const limit = process.env.MARKET_REFRESH_LIMIT
    ? Number(process.env.MARKET_REFRESH_LIMIT)
    : undefined;

  const result = await api.services.refreshMarketData({
    refreshPrices: true,
    refreshMarketInfo: true,
    candleRequests:
      symbol && interval && typeof startTime === "number"
        ? [
            {
              symbol,
              interval,
              priceSource,
              startTime,
              ...(typeof limit === "number" ? { limit } : {}),
            },
          ]
        : (await resolveActivePresetMarketDataRequests()).map((request) =>
            normalizeCandleRequestConfig(request, new Date()),
          ),
  });

  console.log(JSON.stringify(result, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
