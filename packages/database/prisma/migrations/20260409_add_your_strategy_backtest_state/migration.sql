ALTER TABLE "YourStrategy"
ADD COLUMN "lastBacktestPreviewedAt" TIMESTAMPTZ(6),
ADD COLUMN "lastBacktestPreviewFingerprint" TEXT;
