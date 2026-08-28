-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CashFund" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "sourceUrl" TEXT,
    "goalAmountCents" INTEGER,
    "amountRaisedCents" INTEGER NOT NULL DEFAULT 0,
    "paymentPlatform" TEXT NOT NULL DEFAULT 'OTHER',
    "paymentLink" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CashFund_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Admin" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_CashFund" ("amountRaisedCents", "createdAt", "createdById", "description", "goalAmountCents", "id", "imageUrl", "paymentLink", "sourceUrl", "status", "title", "updatedAt") SELECT "amountRaisedCents", "createdAt", "createdById", "description", "goalAmountCents", "id", "imageUrl", "paymentLink", "sourceUrl", "status", "title", "updatedAt" FROM "CashFund";
DROP TABLE "CashFund";
ALTER TABLE "new_CashFund" RENAME TO "CashFund";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
