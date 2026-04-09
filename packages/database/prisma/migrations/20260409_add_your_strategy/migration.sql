-- CreateTable
CREATE TABLE "YourStrategy" (
    "id" UUID NOT NULL,
    "operatorAccountId" UUID NOT NULL,
    "draftJson" JSONB NOT NULL,
    "materializedContractJson" JSONB,
    "activationBlockersJson" JSONB,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "YourStrategy_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "YourStrategy_operatorAccountId_key" ON "YourStrategy"("operatorAccountId");

-- CreateIndex
CREATE INDEX "YourStrategy_operatorAccountId_idx" ON "YourStrategy"("operatorAccountId");

-- AddForeignKey
ALTER TABLE "YourStrategy" ADD CONSTRAINT "YourStrategy_operatorAccountId_fkey" FOREIGN KEY ("operatorAccountId") REFERENCES "OperatorAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
