/*
  Warnings:

  - You are about to drop the column `submittedBy` on the `RsvpAuditLog` table. All the data in the column will be lost.
  - Added the required column `source` to the `RsvpAuditLog` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_RsvpAuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "householdId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "adminId" TEXT,
    "summary" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RsvpAuditLog_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RsvpAuditLog_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_RsvpAuditLog" ("createdAt", "householdId", "id", "summary") SELECT "createdAt", "householdId", "id", "summary" FROM "RsvpAuditLog";
DROP TABLE "RsvpAuditLog";
ALTER TABLE "new_RsvpAuditLog" RENAME TO "RsvpAuditLog";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
