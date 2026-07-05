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
    if ($app.stage === "production" && !process.env.APP_ORIGIN) {
      throw new Error(
        "APP_ORIGIN must be set when deploying to production (CORS would fall back to localhost)",
      );
    }

    const DATABASE_URL = new sst.Secret("DatabaseUrl");
    const CREDENTIAL_ENCRYPTION_KEY = new sst.Secret("CredentialEncryptionKey");
    const AUTH_SIGNING_SECRET = new sst.Secret("AuthSigningSecret");
    const PACIFICA_BUILDER_CODE = new sst.Secret("PacificaBuilderCode");

    const api = new sst.aws.ApiGatewayV2("PacificaApi", {
      cors: {
        allowOrigins: [process.env.APP_ORIGIN ?? "http://localhost:5173"],
        allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowHeaders: ["Content-Type", "Authorization"],
      },
      transform: {
        stage: (args) => {
          args.defaultRouteSettings = {
            throttlingRateLimit: 50,
            throttlingBurstLimit: 100,
          };
        },
      },
    });

    api.route("$default", {
      handler: "packages/api/src/index.handler",
      runtime: "nodejs22.x",
      memory: "512 MB",
      timeout: "29 seconds",
      nodejs: { format: "esm" as const },
      environment: {
        DATABASE_URL: DATABASE_URL.value,
        CREDENTIAL_ENCRYPTION_KEY: CREDENTIAL_ENCRYPTION_KEY.value,
        CREDENTIAL_ENCRYPTION_KEY_ID:
          process.env.CREDENTIAL_ENCRYPTION_KEY_ID ?? "v2",
        AUTH_SIGNING_SECRET: AUTH_SIGNING_SECRET.value,
        PACIFICA_BUILDER_CODE: PACIFICA_BUILDER_CODE.value,
        PACIFICA_BUILDER_MAX_FEE_RATE:
          process.env.PACIFICA_BUILDER_MAX_FEE_RATE ?? "0.007",
        PACIFICA_REST_BASE_URL:
          process.env.PACIFICA_REST_BASE_URL ?? "https://api.pacifica.fi",
        APP_ORIGIN: process.env.APP_ORIGIN ?? "http://localhost:5173",
      },
    });

    return {
      apiUrl: api.url,
    };
  },
});
