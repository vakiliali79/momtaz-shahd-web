-- AlterTable
ALTER TABLE "Order" ADD COLUMN "receiptPath" TEXT;
ALTER TABLE "Order" ADD COLUMN "receiptUploadedAt" DATETIME;
ALTER TABLE "Order" ADD COLUMN "transferReference" TEXT;

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "gateway" TEXT NOT NULL,
    "amount" BIGINT NOT NULL,
    "authority" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "refId" TEXT,
    "cardPan" TEXT,
    "gatewayData" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verifiedAt" DATETIME,
    CONSTRAINT "Payment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Payment_authority_key" ON "Payment"("authority");

-- CreateIndex
CREATE INDEX "Payment_orderId_createdAt_idx" ON "Payment"("orderId", "createdAt");

-- CreateIndex
CREATE INDEX "Payment_status_createdAt_idx" ON "Payment"("status", "createdAt");
