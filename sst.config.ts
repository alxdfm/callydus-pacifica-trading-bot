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
    const CREDENTIAL_ENCRYPTION_KEY = new sst.Secret("CredentialEncryptionKey");
    const PACIFICA_BUILDER_CODE = new sst.Secret("PacificaBuilderCode");

    const api = new sst.aws.ApiGatewayV2("PacificaApi", {
      cors: {
        allowOrigins: [process.env.APP_ORIGIN ?? "http://localhost:5173"],
        allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowHeaders: ["Content-Type", "Authorization"],
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
