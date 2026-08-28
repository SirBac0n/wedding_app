/*
  Warnings:

  - You are about to drop the column `tableNumber` on the `Household` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "Table" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "label" TEXT NOT NULL,
    "capacity" INTEGER,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Household" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "displayName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "addressLine1" TEXT,
    "addressLine2" TEXT,
    "city" TEXT,
    "state" TEXT,
    "postalCode" TEXT,
    "country" TEXT,
    "notes" TEXT,
    "songRequest" TEXT,
    "tableId" TEXT,
    "thankYouSent" BOOLEAN NOT NULL DEFAULT false,
    "rsvpSubmittedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Household_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "Table" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Household" ("addressLine1", "addressLine2", "city", "country", "createdAt", "displayName", "email", "id", "notes", "phone", "postalCode", "rsvpSubmittedAt", "songRequest", "state", "thankYouSent", "updatedAt") SELECT "addressLine1", "addressLine2", "city", "country", "createdAt", "displayName", "email", "id", "notes", "phone", "postalCode", "rsvpSubmittedAt", "songRequest", "state", "thankYouSent", "updatedAt" FROM "Household";
DROP TABLE "Household";
ALTER TABLE "new_Household" RENAME TO "Household";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
