import { PrismaClient } from "@prisma/client";
import { PrismaMarketDataSnapshotRepository } from "../infrastructure/persistence/PrismaMarketDataSnapshotRepository";
import { createCleanupMarketData } from "../application/cleanup-market-data/CleanupMarketData";

const prisma = new PrismaClient();

async function main() {
  const cleanup = createCleanupMarketData({
    repository: new PrismaMarketDataSnapshotRepository(prisma),
  });

  const result = await cleanup({
    candleRetentionMs: Number(
      process.env.MARKET_DATA_CANDLE_RETENTION_MS ?? 7 * 24 * 60 * 60_000,
    ),
    refreshLogRetentionMs: Number(
      process.env.MARKET_DATA_REFRESH_LOG_RETENTION_MS ?? 7 * 24 * 60 * 60_000,
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
