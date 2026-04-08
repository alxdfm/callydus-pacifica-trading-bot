-- CreateEnum
CREATE TYPE "MarketSnapshotStatus" AS ENUM ('confirmed', 'stale', 'unavailable');

-- CreateEnum
CREATE TYPE "MarketPriceSource" AS ENUM ('market', 'mark');

-- CreateTable
CREATE TABLE "MarketPriceCurrent" (
    "symbol" TEXT NOT NULL,
    "markPrice" DECIMAL(24,8) NOT NULL,
    "indexPrice" DECIMAL(24,8),
    "lastPrice" DECIMAL(24,8),
    "volume24h" DECIMAL(24,8),
    "openInterest" DECIMAL(24,8),
    "fundingRate" DECIMAL(18,12),
    "capturedAt" TIMESTAMPTZ(6) NOT NULL,
    "fetchedAt" TIMESTAMPTZ(6) NOT NULL,
    "snapshotStatus" "MarketSnapshotStatus" NOT NULL DEFAULT 'confirmed',
    "source" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "MarketPriceCurrent_pkey" PRIMARY KEY ("symbol")
);

-- CreateTable
CREATE TABLE "MarketCandleSnapshot" (
    "id" UUID NOT NULL,
    "symbol" TEXT NOT NULL,
    "interval" TEXT NOT NULL,
    "priceSource" "MarketPriceSource" NOT NULL,
    "openTime" TIMESTAMPTZ(6) NOT NULL,
    "closeTime" TIMESTAMPTZ(6) NOT NULL,
    "open" DECIMAL(24,8) NOT NULL,
    "high" DECIMAL(24,8) NOT NULL,
    "low" DECIMAL(24,8) NOT NULL,
    "close" DECIMAL(24,8) NOT NULL,
    "volume" DECIMAL(24,8) NOT NULL,
    "fetchedAt" TIMESTAMPTZ(6) NOT NULL,
    "snapshotStatus" "MarketSnapshotStatus" NOT NULL DEFAULT 'confirmed',
    "source" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketCandleSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketInfoCurrent" (
    "symbol" TEXT NOT NULL,
    "tickSize" DECIMAL(24,8) NOT NULL,
    "lotSize" DECIMAL(24,8) NOT NULL,
    "minOrderSize" DECIMAL(24,8) NOT NULL,
    "maxOrderSize" DECIMAL(24,8),
    "maxLeverage" DECIMAL(18,8),
    "fetchedAt" TIMESTAMPTZ(6) NOT NULL,
    "snapshotStatus" "MarketSnapshotStatus" NOT NULL DEFAULT 'confirmed',
    "source" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "MarketInfoCurrent_pkey" PRIMARY KEY ("symbol")
);

-- CreateTable
CREATE TABLE "MarketRefreshLog" (
    "id" UUID NOT NULL,
    "refreshType" TEXT NOT NULL,
    "refreshKey" TEXT NOT NULL,
    "startedAt" TIMESTAMPTZ(6) NOT NULL,
    "finishedAt" TIMESTAMPTZ(6),
    "status" TEXT NOT NULL,
    "errorMessage" TEXT,
    "recordsWritten" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketRefreshLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MarketPriceCurrent_fetchedAt_idx" ON "MarketPriceCurrent"("fetchedAt" DESC);

-- CreateIndex
CREATE INDEX "MarketCandleSnapshot_symbol_interval_priceSource_openTime_idx" ON "MarketCandleSnapshot"("symbol", "interval", "priceSource", "openTime" DESC);

-- CreateIndex
CREATE INDEX "MarketCandleSnapshot_fetchedAt_idx" ON "MarketCandleSnapshot"("fetchedAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "MarketCandleSnapshot_symbol_interval_priceSource_openTime_key" ON "MarketCandleSnapshot"("symbol", "interval", "priceSource", "openTime");

-- CreateIndex
CREATE INDEX "MarketInfoCurrent_fetchedAt_idx" ON "MarketInfoCurrent"("fetchedAt" DESC);

-- CreateIndex
CREATE INDEX "MarketRefreshLog_refreshType_startedAt_idx" ON "MarketRefreshLog"("refreshType", "startedAt" DESC);

-- CreateIndex
CREATE INDEX "MarketRefreshLog_refreshKey_startedAt_idx" ON "MarketRefreshLog"("refreshKey", "startedAt" DESC);

