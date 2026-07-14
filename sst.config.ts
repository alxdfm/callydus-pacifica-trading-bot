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
        allowOrigins: (process.env.APP_ORIGIN ?? "http://localhost:5173")
          .split(",")
          .map((origin) => origin.trim())
          .filter(Boolean),
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
      // 1024 MB dobra a CPU alocada (backtest é CPU-bound); custo irrelevante
      // neste tráfego
      memory: "1024 MB",
      timeout: "29 seconds",
      nodejs: { format: "esm" as const },
      environment: {
        NODE_ENV: "production",
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

    // -------------------------------------------------------------------
    // Worker — Lambda agendada (decisão 2026-07-14; antes era ECS Fargate 24/7)
    // -------------------------------------------------------------------
    // O bot só avalia candle FECHADO, e com timeframes de 1h/4h o sinal só pode
    // mudar de hora em hora — presença contínua era desperdício (e mantinha o
    // Neon acordado 24/7, estourando as 100 CU-h do plano Free). SL/TP são
    // submetidos à exchange junto com a ordem, então o bot ficar fora do ar
    // entre invocações não desprotege posição nenhuma.
    //
    // cron no minuto :01 UTC — os fechamentos de 4h são subconjunto dos de 1h,
    // então um único schedule horário cobre os dois timeframes.
    const workerCron = new sst.aws.Cron("PacificaWorkerCron", {
      schedule: "cron(1 * * * ? *)",
      function: {
        handler: "packages/worker/src/handler.handler",
        runtime: "nodejs22.x",
        architecture: "arm64",
        memory: "512 MB",
        timeout: "2 minutes",
        // EventBridge invoca async e por default re-executa 2x em erro. Um
        // retry depois de "ordem submetida + crash antes do insert" abriria
        // posição duplicada — o pior caso com 0 é perder uma avaliação horária.
        retries: 0,
        // Exclusão mútua real: nunca duas execuções em paralelo (não existe
        // lease no código — o guard de posição em bot.ts é read-then-act)
        concurrency: { reserved: 1 },
        nodejs: { format: "esm" as const },
        environment: {
          NODE_ENV: "production",
          DATABASE_URL: DATABASE_URL.value,
          CREDENTIAL_ENCRYPTION_KEY: CREDENTIAL_ENCRYPTION_KEY.value,
          CREDENTIAL_ENCRYPTION_KEY_ID:
            process.env.CREDENTIAL_ENCRYPTION_KEY_ID ?? "v2",
          PACIFICA_BUILDER_CODE: PACIFICA_BUILDER_CODE.value,
          PACIFICA_REST_URL:
            process.env.PACIFICA_REST_BASE_URL ?? "https://api.pacifica.fi",
        },
      },
    });

    // -------------------------------------------------------------------
    // Alertas — só criados quando ALERT_EMAIL está definido no ambiente
    // -------------------------------------------------------------------
    if (process.env.ALERT_EMAIL) {
      const alertTopic = new aws.sns.Topic("PacificaAlerts");
      new aws.sns.TopicSubscription("PacificaAlertsEmail", {
        topic: alertTopic.arn,
        protocol: "email",
        endpoint: process.env.ALERT_EMAIL,
      });

      // API retornando 5xx
      new aws.cloudwatch.MetricAlarm("PacificaApi5xxAlarm", {
        alarmDescription: "Pacifica API is returning 5xx responses",
        namespace: "AWS/ApiGateway",
        metricName: "5xx",
        dimensions: { ApiId: api.nodes.api.id },
        statistic: "Sum",
        period: 300,
        evaluationPeriods: 1,
        threshold: 5,
        comparisonOperator: "GreaterThanOrEqualToThreshold",
        treatMissingData: "notBreaching",
        alarmActions: [alertTopic.arn],
        okActions: [alertTopic.arn],
      });

      // Tick do worker falhando (com retries: 0 não há segunda chance na hora)
      new aws.cloudwatch.MetricAlarm("PacificaWorkerErrorsAlarm", {
        alarmDescription: "Pacifica worker tick failed",
        namespace: "AWS/Lambda",
        metricName: "Errors",
        dimensions: { FunctionName: workerCron.nodes.function.name },
        statistic: "Sum",
        period: 3600,
        evaluationPeriods: 1,
        threshold: 1,
        comparisonOperator: "GreaterThanOrEqualToThreshold",
        treatMissingData: "notBreaching",
        alarmActions: [alertTopic.arn],
        okActions: [alertTopic.arn],
      });

      // Dead man's switch: o cron é horário, então uma hora sem invocação
      // NENHUMA significa schedule quebrado/desabilitado — falha silenciosa
      // que nenhum alarme de erro pega. 2 períodos para não flapar com o
      // alinhamento dos buckets do CloudWatch.
      new aws.cloudwatch.MetricAlarm("PacificaWorkerSilentAlarm", {
        alarmDescription: "Pacifica worker cron is not being invoked",
        namespace: "AWS/Lambda",
        metricName: "Invocations",
        dimensions: { FunctionName: workerCron.nodes.function.name },
        statistic: "Sum",
        period: 3600,
        evaluationPeriods: 2,
        threshold: 1,
        comparisonOperator: "LessThanThreshold",
        treatMissingData: "breaching",
        alarmActions: [alertTopic.arn],
        okActions: [alertTopic.arn],
      });
    }

    return {
      apiUrl: api.url,
    };
  },
});
