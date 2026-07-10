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
    // Worker — ECS Fargate (1 instância; lease no banco garante exclusão mútua)
    // NAT via EC2 (fck-nat) — ~10x mais barato que NAT Gateway gerenciado
    // -------------------------------------------------------------------
    // t4g.micro: única opção ARM free-tier-eligible (conta no plano free
    // só pode lançar instâncias free-tier-eligible)
    const vpc = new sst.aws.Vpc("PacificaVpc", {
      nat: { ec2: { instance: "t4g.micro" } },
    });
    const cluster = new sst.aws.Cluster("PacificaCluster", { vpc });

    const worker = new sst.aws.Service("PacificaWorker", {
      cluster,
      image: {
        context: ".",
        dockerfile: "packages/worker/Dockerfile",
      },
      cpu: "0.25 vCPU",
      memory: "0.5 GB",
      environment: {
        NODE_ENV: "production",
        DATABASE_URL: DATABASE_URL.value,
        CREDENTIAL_ENCRYPTION_KEY: CREDENTIAL_ENCRYPTION_KEY.value,
        CREDENTIAL_ENCRYPTION_KEY_ID:
          process.env.CREDENTIAL_ENCRYPTION_KEY_ID ?? "v2",
        PACIFICA_BUILDER_CODE: PACIFICA_BUILDER_CODE.value,
        PACIFICA_REST_URL:
          process.env.PACIFICA_REST_BASE_URL ?? "https://api.pacifica.fi",
        PACIFICA_WS_URL:
          process.env.PACIFICA_WS_URL ?? "wss://ws.pacifica.fi/ws",
        WORKER_ID: `worker-${$app.stage}-1`,
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

      // Dead man's switch do worker: sem métrica de CPU = worker parado
      new aws.cloudwatch.MetricAlarm("PacificaWorkerDownAlarm", {
        alarmDescription: "Pacifica worker has no running task",
        namespace: "AWS/ECS",
        metricName: "CPUUtilization",
        dimensions: {
          ClusterName: cluster.nodes.cluster.name,
          ServiceName: worker.nodes.service.name,
        },
        statistic: "SampleCount",
        period: 300,
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
