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
    // Resolve the Prisma query engine binary path dynamically so the path
    // stays correct after pnpm installs or Prisma version bumps.
    // pnpm isolates packages under node_modules/.pnpm/<pkg@version>/node_modules/,
    // so we walk from @prisma/client's resolved entry point to find .prisma/client.
    const { createRequire } = await import("module");
    const { dirname, resolve, relative } = await import("path");

    // @prisma/client is only accessible from packages/database in pnpm's
    // isolated node_modules. Anchor resolution there so it's found regardless
    // of where SST evaluates the config from (.sst/platform/).
    const req = createRequire(resolve(process.cwd(), "packages/database/package.json"));
    const clientEntry: string = req.resolve("@prisma/client");
    // clientEntry: .../node_modules/.pnpm/@prisma+client@X/node_modules/@prisma/client/default.js
    //   dirname×1 → @prisma/client dir
    //   dirname×2 → @prisma dir
    //   dirname×3 → node_modules dir (pnpm virtual store root for this package)
    const nodeModulesDir = dirname(dirname(dirname(clientEntry)));
    const LAMBDA_TARGET = "rhel-openssl-3.0.x";
    const engineAbsPath = resolve(
      nodeModulesDir,
      `.prisma/client/libquery_engine-${LAMBDA_TARGET}.so.node`,
    );
    const engineRelPath = relative(process.cwd(), engineAbsPath);

    // Shared nodejs bundling config for all Lambda functions that use Prisma.
    // - external: esbuild leaves @prisma/client as-is (it's a native module)
    // - copyFiles: packs the query engine binary into the Lambda zip
    const prismaNode = {
      format: "esm" as const,
      external: ["@prisma/client", ".prisma"],
      copyFiles: [
        {
          from: engineRelPath,
          to: `libquery_engine-${LAMBDA_TARGET}.so.node`,
        },
      ],
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
      PACIFICA_REST_BASE_URL:
        process.env.PACIFICA_REST_BASE_URL ?? "https://api.pacifica.fi",
      CREDENTIAL_ENCRYPTION_KEY_ID:
        process.env.CREDENTIAL_ENCRYPTION_KEY_ID ?? "v2",
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
      environment: commonEnv,
      nodejs: prismaNode,
    });

    // --- Market data refresh Lambda (scheduled) ---

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
