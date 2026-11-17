-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_WholesaleRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL DEFAULT 'WHOLESALE',
    "companyName" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "province" TEXT,
    "city" TEXT NOT NULL,
    "products" TEXT NOT NULL,
    "estimatedQty" TEXT,
    "message" TEXT,
    "locale" TEXT NOT NULL DEFAULT 'fa',
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "adminNote" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_WholesaleRequest" ("adminNote", "city", "companyName", "contactName", "createdAt", "email", "estimatedQty", "id", "message", "phone", "products", "status", "updatedAt") SELECT "adminNote", "city", "companyName", "contactName", "createdAt", "email", "estimatedQty", "id", "message", "phone", "products", "status", "updatedAt" FROM "WholesaleRequest";
DROP TABLE "WholesaleRequest";
ALTER TABLE "new_WholesaleRequest" RENAME TO "WholesaleRequest";
CREATE INDEX "WholesaleRequest_status_createdAt_idx" ON "WholesaleRequest"("status", "createdAt");
CREATE INDEX "WholesaleRequest_phone_createdAt_idx" ON "WholesaleRequest"("phone", "createdAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
