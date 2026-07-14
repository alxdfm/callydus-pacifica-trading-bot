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
    // Worker — ECS Fargate (1 instância)
    // -------------------------------------------------------------------
    // ATENÇÃO: NÃO existe lease/exclusão mútua no worker (LEASE_DURATION_MS e
    // WORKER_ID são lidos em config/env.ts mas nunca usados). Enquanto isso for
    // verdade, duas tasks simultâneas abrem ordens duplicadas — o guard em
    // bot.ts é um read-then-act sem índice único. Por isso o deployment abaixo
    // derruba a task antiga ANTES de subir a nova.
    // -------------------------------------------------------------------
    // Sem NAT de propósito: o SST coloca os containers nas subnets públicas com
    // IP público (`assignPublicIp`), então a task já sai pela Internet Gateway e
    // um NAT nunca chegaria a ver tráfego — seria ~$20/mês parado. O inbound
    // continua fechado pelo SG default da VPC, que só aceita o CIDR da própria
    // VPC, e o worker não escuta em porta nenhuma.
    // Só volte a ligar NAT se precisar de IP de saída fixo (ex.: allowlist de IP
    // na Pacifica ou no Neon) — nesse caso use `nat: { ec2: { instance:
    // "t4g.nano" } }` com `az: 1`.
    const vpc = new sst.aws.Vpc("PacificaVpc");
    const cluster = new sst.aws.Cluster("PacificaCluster", { vpc });

    const worker = new sst.aws.Service("PacificaWorker", {
      cluster,
      image: {
        context: ".",
        dockerfile: "packages/worker/Dockerfile",
      },
      // Graviton: ~20% mais barato que x86 no Fargate. Exige buildar a imagem em
      // linux/arm64 — ver o setup do QEMU no workflow de deploy.
      architecture: "arm64",
      transform: {
        // O default do ECS (min 100% / max 200%) sobe a task nova antes de
        // drenar a antiga — dois bots vivos por ~1 min a cada deploy. Sem lease,
        // isso é ordem duplicada. 0%/100% troca isso por ~1 min de downtime no
        // deploy, que para 1 worker é o trade certo.
        service: (args) => {
          args.deploymentMinimumHealthyPercent = 0;
          args.deploymentMaximumPercent = 100;
        },
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
