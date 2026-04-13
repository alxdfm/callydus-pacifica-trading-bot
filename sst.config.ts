/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "pacifica-bot",
      removal: input?.stage === "production" ? "retain" : "remove",
      protect: ["production"].includes(input?.stage),
      home: "aws",
    };
  },

  async run() {
    const DATABASE_URL = new sst.Secret("DatabaseUrl");
    const DIRECT_DATABASE_URL = new sst.Secret("DirectDatabaseUrl");
    const CREDENTIAL_ENCRYPTION_KEY = new sst.Secret("CredentialEncryptionKey");
    const PACIFICA_BUILDER_CODE = new sst.Secret("PacificaBuilderCode");
    const INTERNAL_API_SECRET = new sst.Secret("InternalApiSecret");

    const commonEnv = {
      DATABASE_URL: DATABASE_URL.value,
      DIRECT_DATABASE_URL: DIRECT_DATABASE_URL.value,
      CREDENTIAL_ENCRYPTION_KEY: CREDENTIAL_ENCRYPTION_KEY.value,
      PACIFICA_BUILDER_CODE: PACIFICA_BUILDER_CODE.value,
      INTERNAL_API_SECRET: INTERNAL_API_SECRET.value,
      PACIFICA_REST_BASE_URL:
        process.env.PACIFICA_REST_BASE_URL ?? "https://api.pacifica.fi",
      CREDENTIAL_ENCRYPTION_KEY_ID:
        process.env.CREDENTIAL_ENCRYPTION_KEY_ID ?? "v2",
    };

    // --- API Gateway + Lambda HTTP handler ---

    const api = new sst.aws.ApiGatewayV2("PacificaApi", {
      cors: {
        allowOrigins: [
          process.env.APP_ORIGIN ?? "http://localhost:5173",
        ],
        allowMethods: ["GET", "POST", "OPTIONS"],
        allowHeaders: ["Content-Type", "Authorization"],
      },
    });

    api.route("$default", {
      handler: "apps/api/src/lambda/httpHandler.handler",
      runtime: "nodejs22.x",
      memory: "512 MB",
      timeout: "29 seconds",
      environment: commonEnv,
      nodejs: {
        // esbuild bundles ts → js; no need for tsx at runtime
        format: "esm",
      },
    });

    // --- Market data refresh Lambda (scheduled, replaces startLocalMarketDataRefreshScheduler) ---

    const marketRefreshFn = new sst.aws.Function("MarketRefreshHandler", {
      handler: "apps/api/src/lambda/marketRefreshHandler.handler",
      runtime: "nodejs22.x",
      memory: "256 MB",
      timeout: "55 seconds",
      environment: {
        DATABASE_URL: DATABASE_URL.value,
        DIRECT_DATABASE_URL: DIRECT_DATABASE_URL.value,
        CREDENTIAL_ENCRYPTION_KEY: CREDENTIAL_ENCRYPTION_KEY.value,
        PACIFICA_BUILDER_CODE: PACIFICA_BUILDER_CODE.value,
        INTERNAL_API_SECRET: INTERNAL_API_SECRET.value,
        PACIFICA_REST_BASE_URL:
          process.env.PACIFICA_REST_BASE_URL ?? "https://api.pacifica.fi",
      },
    });

    // EventBridge rule: runs every minute
    new sst.aws.Cron("MarketRefreshCron", {
      schedule: "rate(1 minute)",
      job: marketRefreshFn,
    });

    return {
      apiUrl: api.url,
    };
  },
});
