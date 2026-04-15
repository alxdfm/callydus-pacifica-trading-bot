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
    const { createRequire } = await import("module");
    const { dirname, resolve, relative } = await import("path");
    const { cpSync, mkdirSync, readdirSync, statSync } = await import("fs");

    // Resolve the generated Prisma client from pnpm's virtual store.
    const req = createRequire(resolve(process.cwd(), "packages/database/package.json"));
    const clientEntry: string = req.resolve("@prisma/client");
    const nodeModulesDir = dirname(dirname(dirname(clientEntry)));
    const LAMBDA_TARGET = "rhel-openssl-3.0.x";

    // Stage the generated .prisma/client/ JS files (no binary) to a flat path.
    // The engine binary (.so.node) is served from the Lambda Layer at /opt/.
    const prismaClientSrc = resolve(nodeModulesDir, ".prisma/client");
    const prismaClientDest = resolve(process.cwd(), ".build/prisma-client");
    mkdirSync(prismaClientDest, { recursive: true });
    cpSync(prismaClientSrc, prismaClientDest, { recursive: true });

    // Copy only non-binary .prisma/client files into the Lambda bundle.
    // The .so.node engine binary comes from the Lambda Layer, not from copyFiles.
    const prismaClientFiles = readdirSync(prismaClientDest)
      .filter((file) => {
        if (!statSync(resolve(prismaClientDest, file)).isFile()) return false;
        if (file.endsWith(".node")) return false; // binary — served via Layer
        return true;
      })
      .map((file) => ({
        from: relative(process.cwd(), resolve(prismaClientDest, file)),
        to: `.prisma/client/${file}`,
      }));

    // Engine binary is mounted at /opt/ by the Lambda Layer.
    const LAMBDA_ENGINE_PATH = `/opt/libquery_engine-${LAMBDA_TARGET}.so.node`;

    // Lambda Layer ARN containing the Prisma query engine binary for rhel-openssl-3.0.x.
    const PRISMA_ENGINE_LAYER = "arn:aws:lambda:us-east-1:943378954443:layer:prisma-engine-rhel-3:1";

    const prismaNode = {
      format: "esm" as const,
      external: [".prisma"],
      copyFiles: prismaClientFiles,
    };

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
      PACIFICA_BUILDER_MAX_FEE_RATE:
        process.env.PACIFICA_BUILDER_MAX_FEE_RATE ?? "0.007",
      PACIFICA_REST_BASE_URL:
        process.env.PACIFICA_REST_BASE_URL ?? "https://api.pacifica.fi",
      CREDENTIAL_ENCRYPTION_KEY_ID:
        process.env.CREDENTIAL_ENCRYPTION_KEY_ID ?? "v2",
      PRISMA_QUERY_ENGINE_LIBRARY: LAMBDA_ENGINE_PATH,
    };

    // --- API Gateway + Lambda HTTP handler ---

    const api = new sst.aws.ApiGatewayV2("PacificaApi", {
      cors: {
        allowOrigins: [process.env.APP_ORIGIN ?? "http://localhost:5173"],
        allowMethods: ["GET", "POST", "OPTIONS"],
        allowHeaders: ["Content-Type", "Authorization"],
      },
    });

    api.route("$default", {
      handler: "apps/api/src/lambda/httpHandler.handler",
      runtime: "nodejs22.x",
      memory: "512 MB",
      timeout: "29 seconds",
      layers: [PRISMA_ENGINE_LAYER],
      environment: commonEnv,
      nodejs: prismaNode,
    });

    // --- Market data refresh Lambda (scheduled) ---

    const marketRefreshFn = new sst.aws.Function("MarketRefreshHandler", {
      handler: "apps/api/src/lambda/marketRefreshHandler.handler",
      runtime: "nodejs22.x",
      memory: "256 MB",
      timeout: "55 seconds",
      layers: [PRISMA_ENGINE_LAYER],
      environment: {
        DATABASE_URL: DATABASE_URL.value,
        DIRECT_DATABASE_URL: DIRECT_DATABASE_URL.value,
        CREDENTIAL_ENCRYPTION_KEY: CREDENTIAL_ENCRYPTION_KEY.value,
        PACIFICA_BUILDER_CODE: PACIFICA_BUILDER_CODE.value,
        INTERNAL_API_SECRET: INTERNAL_API_SECRET.value,
        PACIFICA_REST_BASE_URL:
          process.env.PACIFICA_REST_BASE_URL ?? "https://api.pacifica.fi",
        PRISMA_QUERY_ENGINE_LIBRARY: LAMBDA_ENGINE_PATH,
      },
      nodejs: prismaNode,
    });

    // EventBridge: roda a cada 1 minuto
    new sst.aws.Cron("MarketRefreshCron", {
      schedule: "rate(1 minute)",
      job: marketRefreshFn,
    });

    return {
      apiUrl: api.url,
    };
  },
});
