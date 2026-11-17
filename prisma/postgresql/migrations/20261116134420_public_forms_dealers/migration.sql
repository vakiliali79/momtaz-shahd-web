-- CreateEnum
CREATE TYPE "WholesaleRequestType" AS ENUM ('WHOLESALE', 'AGENCY');

-- AlterTable
ALTER TABLE "WholesaleRequest" ADD COLUMN     "locale" TEXT NOT NULL DEFAULT 'fa',
ADD COLUMN     "province" TEXT,
ADD COLUMN     "type" "WholesaleRequestType" NOT NULL DEFAULT 'WHOLESALE';

-- CreateIndex
CREATE INDEX "WholesaleRequest_phone_createdAt_idx" ON "WholesaleRequest"("phone", "createdAt");
