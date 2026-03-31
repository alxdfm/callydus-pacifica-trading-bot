import { PrismaClient } from "@prisma/client";
import {
  BALANCED_PRESET_DEFINITION_ID,
  MORE_ACTIVE_PRESET_DEFINITION_ID,
  SAFER_PRESET_DEFINITION_ID,
  getPresetTechnicalContractByDefinitionId,
} from "@pacifica/contracts";

const prisma = new PrismaClient();

type SeedArgs = {
  walletAddress: string;
  preset: "safer" | "balanced" | "more-active";
  botStatus: "inactive" | "active" | "paused" | "syncing" | "error";
  symbol: string;
};

const presetMetadata = {
  safer: {
    presetDefinitionId: SAFER_PRESET_DEFINITION_ID,
    slug: "safer",
    riskLabel: "Low risk",
    frequencyLabel: "Low frequency",
    description: "Lower activity and stronger protection.",
  },
  balanced: {
    presetDefinitionId: BALANCED_PRESET_DEFINITION_ID,
    slug: "balanced",
    riskLabel: "Balanced",
    frequencyLabel: "Balanced frequency",
    description: "Balanced protection and activity.",
  },
  "more-active": {
    presetDefinitionId: MORE_ACTIVE_PRESET_DEFINITION_ID,
    slug: "more-active",
    riskLabel: "More active",
    frequencyLabel: "Higher frequency",
    description: "More entries and tighter reaction cadence.",
  },
} as const;

function parseArgs(): SeedArgs {
  const rawArgs = process.argv.slice(2);
  const args = new Map<string, string>();

  for (let index = 0; index < rawArgs.length; index += 1) {
    const current = rawArgs[index];
    const next = rawArgs[index + 1];

    if (!current?.startsWith("--") || !next) {
      continue;
    }

    args.set(current.slice(2), next);
    index += 1;
  }

  const walletAddress = args.get("wallet");

  if (!walletAddress?.trim()) {
    throw new Error("Missing required --wallet argument.");
  }

  const preset = (args.get("preset") ?? "safer") as SeedArgs["preset"];
  const botStatus = (args.get("bot-status") ?? "active") as SeedArgs["botStatus"];
  const symbol = (args.get("symbol") ?? "BTC/USDC").trim();

  if (!(preset in presetMetadata)) {
    throw new Error("Invalid --preset. Use safer, balanced or more-active.");
  }

  if (!["inactive", "active", "paused", "syncing", "error"].includes(botStatus)) {
    throw new Error(
      "Invalid --bot-status. Use inactive, active, paused, syncing or error.",
    );
  }

  return {
    walletAddress: walletAddress.trim(),
    preset,
    botStatus,
    symbol,
  };
}

async function main() {
  const args = parseArgs();
  const now = new Date();
  const metadata = presetMetadata[args.preset];
  const baseContract = getPresetTechnicalContractByDefinitionId(
    metadata.presetDefinitionId,
  );

  if (!baseContract) {
    throw new Error("Preset technical contract not found.");
  }

  const effectiveContract = {
    ...baseContract,
    symbol: args.symbol,
  };

  const operatorAccount = await prisma.operatorAccount.upsert({
    where: {
      walletAddress: args.walletAddress,
    },
    update: {
      onboardingStatus: "ready",
    },
    create: {
      walletAddress: args.walletAddress,
      onboardingStatus: "ready",
    },
  });

  await prisma.$transaction([
    prisma.botRuntimeState.deleteMany({
      where: { operatorAccountId: operatorAccount.id },
    }),
    prisma.openTrade.deleteMany({
      where: { operatorAccountId: operatorAccount.id },
    }),
    prisma.closedTrade.deleteMany({
      where: { operatorAccountId: operatorAccount.id },
    }),
    prisma.accountBalanceSnapshot.deleteMany({
      where: { operatorAccountId: operatorAccount.id },
    }),
    prisma.operationalAlert.deleteMany({
      where: { operatorAccountId: operatorAccount.id },
    }),
    prisma.presetActivation.deleteMany({
      where: { operatorAccountId: operatorAccount.id },
    }),
    prisma.pacificaCredential.updateMany({
      where: {
        OR: [
          { operatorAccountId: operatorAccount.id },
          { walletAddress: args.walletAddress },
        ],
      },
      data: {
        lifecycleStatus: "replaced",
      },
    }),
  ]);

  const credential = await prisma.pacificaCredential.create({
    data: {
      operatorAccountId: operatorAccount.id,
      walletAddress: args.walletAddress,
      credentialAlias: `fm-008-${args.preset}`,
      publicKey: `seed-agent-${args.walletAddress.slice(0, 8)}`,
      encryptedPrivateKeyRef: "seed-encrypted-private-key-ref",
      keyFingerprint: `seed-fingerprint-${args.walletAddress.slice(0, 8)}`,
      validationStatus: "valid",
      lifecycleStatus: "active",
      operationallyVerified: true,
      lastValidatedAt: now,
      lastOperationalVerifiedAt: now,
      lastOperationalProbeJson: {
        seeded: true,
        source: "seed-fm-008-session",
      },
    },
  });

  await prisma.presetDefinition.upsert({
    where: {
      id: metadata.presetDefinitionId,
    },
    update: {
      name: baseContract.name,
      slug: metadata.slug,
      version: baseContract.version,
      riskLabel: metadata.riskLabel,
      frequencyLabel: metadata.frequencyLabel,
      description: metadata.description,
      baseContractJson: baseContract,
      isActive: true,
    },
    create: {
      id: metadata.presetDefinitionId,
      name: baseContract.name,
      slug: metadata.slug,
      version: baseContract.version,
      riskLabel: metadata.riskLabel,
      frequencyLabel: metadata.frequencyLabel,
      description: metadata.description,
      baseContractJson: baseContract,
      isActive: true,
    },
  });

  const activation = await prisma.presetActivation.create({
    data: {
      operatorAccountId: operatorAccount.id,
      presetDefinitionId: metadata.presetDefinitionId,
      activationStatus: "active",
      symbol: args.symbol,
      positionSizeType: "balance_percent",
      positionSizeValue: "3",
      longEnabled: true,
      shortEnabled: true,
      editableConfigJson: {
        symbol: args.symbol,
        positionSizeType: "balance_percent",
        positionSizeValue: 3,
        longEnabled: true,
        shortEnabled: true,
      },
      effectiveContractJson: effectiveContract,
      activatedAt: now,
      createdBy: "seed-fm-008-session",
    },
  });

  await prisma.botRuntimeState.create({
    data: {
      operatorAccountId: operatorAccount.id,
      botStatus: args.botStatus,
      pacificaConnectionStatus: "connected",
      syncStatus: args.botStatus === "syncing" ? "syncing" : "healthy",
      activePresetActivationId: activation.id,
      lastHeartbeatAt: now,
      lastErrorMessage:
        args.botStatus === "error" ? "Seeded runtime error for FM-008 testing." : null,
    },
  });

  await prisma.accountBalanceSnapshot.create({
    data: {
      operatorAccountId: operatorAccount.id,
      totalBalance: "12480.12",
      availableBalance: "9350.42",
      aggregatedPnl: "328.44",
      capitalInUse: "3129.70",
      capturedAt: now,
    },
  });

  await prisma.openTrade.createMany({
    data: [
      {
        operatorAccountId: operatorAccount.id,
        pacificaTradeId: `seed-open-1-${Date.now()}`,
        presetActivationId: activation.id,
        stopLossPrice: "63640",
        takeProfitPrice: "65560",
        entryClientOrderId: `seed-open-1-${Date.now()}:entry`,
        pacificaOrderId: `seed-open-1-${Date.now()}:order`,
        symbol: args.symbol,
        side: "long",
        entryPrice: "64280",
        currentPrice: "64990",
        quantity: "0.12",
        capitalAllocated: "1500",
        unrealizedPnl: "102",
        tradeStatus: "open",
        openedAt: now,
        closeRequestedAt: null,
        closeReasonPending: null,
        isPlatformTrade: true,
        lastSyncedAt: now,
      },
      {
        operatorAccountId: operatorAccount.id,
        pacificaTradeId: `seed-open-2-${Date.now()}`,
        presetActivationId: activation.id,
        stopLossPrice: "3235",
        takeProfitPrice: "3128",
        entryClientOrderId: `seed-open-2-${Date.now()}:entry`,
        pacificaOrderId: `seed-open-2-${Date.now()}:order`,
        symbol: "ETH/USDC",
        side: "short",
        entryPrice: "3180",
        currentPrice: "3206",
        quantity: "0.70",
        capitalAllocated: "2200",
        unrealizedPnl: "-39",
        tradeStatus: "close_requested",
        openedAt: now,
        closeRequestedAt: now,
        closeReasonPending: "manual",
        isPlatformTrade: true,
        lastSyncedAt: now,
      },
    ],
  });

  await prisma.closedTrade.createMany({
    data: [
      {
        operatorAccountId: operatorAccount.id,
        pacificaTradeId: `seed-closed-1-${Date.now()}`,
        presetActivationId: activation.id,
        symbol: "ETH/USDC",
        side: "long",
        entryPrice: "3180",
        exitPrice: "3244",
        quantity: "0.70",
        capitalAllocated: "2200",
        realizedPnl: "74",
        closeReason: "take_profit",
        openedAt: now,
        closedAt: now,
        isPlatformTrade: true,
        lastSyncedAt: now,
      },
      {
        operatorAccountId: operatorAccount.id,
        pacificaTradeId: `seed-closed-2-${Date.now()}`,
        presetActivationId: activation.id,
        symbol: "BTC/USDC",
        side: "long",
        entryPrice: "64120",
        exitPrice: "63890",
        quantity: "0.10",
        capitalAllocated: "1400",
        realizedPnl: "-35",
        closeReason: "stop_loss",
        openedAt: now,
        closedAt: now,
        isPlatformTrade: true,
        lastSyncedAt: now,
      },
    ],
  });

  await prisma.operationalAlert.createMany({
    data: [
      {
        operatorAccountId: operatorAccount.id,
        alertType: "runtime",
        severity: "info",
        title: "Seeded runtime state",
        message: "FM-008 seeded session loaded for dashboard/trades/history validation.",
        isActive: true,
        createdAt: now,
        resolvedAt: null,
      },
      {
        operatorAccountId: operatorAccount.id,
        alertType: "reconciliation",
        severity: "warning",
        title: "Seeded reconciliation warning",
        message: "One trade is waiting for final exchange confirmation.",
        isActive: true,
        createdAt: now,
        resolvedAt: null,
      },
    ],
  });

  console.log("FM-008 seed completed.");
  console.log(
    JSON.stringify(
      {
        walletAddress: args.walletAddress,
        operatorAccountId: operatorAccount.id,
        credentialId: credential.id,
        presetActivationId: activation.id,
        botStatus: args.botStatus,
        symbol: args.symbol,
        preset: args.preset,
      },
      null,
      2,
    ),
  );
  console.log("");
  console.log("Next checks:");
  console.log("1. Connect this wallet in the app.");
  console.log("2. Confirm redirect to /dashboard if the account already exists.");
  console.log("3. Validate dashboard, trades and history against /api/account/session.");
}

main()
  .catch((error) => {
    console.error("FM-008 seed failed.");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
