-- CreateTable
CREATE TABLE "MealOption" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "label" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "RsvpQuestion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "label" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "RsvpAnswer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "questionId" TEXT NOT NULL,
    "guestId" TEXT,
    "householdId" TEXT,
    "value" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RsvpAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "RsvpQuestion" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RsvpAnswer_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "Guest" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RsvpAnswer_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_EventSettings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "weddingDate" DATETIME,
    "timezone" TEXT NOT NULL DEFAULT 'America/Chicago',
    "rsvpCutoffAt" DATETIME,
    "tableLookupEnabled" BOOLEAN NOT NULL DEFAULT false,
    "registryRevealAt" DATETIME,
    "dataRetentionMonths" INTEGER NOT NULL DEFAULT 6,
    "contactEmail" TEXT,
    "rsvpShowSongRequest" BOOLEAN NOT NULL DEFAULT true,
    "rsvpShowDietaryNotes" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_EventSettings" ("contactEmail", "dataRetentionMonths", "id", "registryRevealAt", "rsvpCutoffAt", "tableLookupEnabled", "timezone", "updatedAt", "weddingDate") SELECT "contactEmail", "dataRetentionMonths", "id", "registryRevealAt", "rsvpCutoffAt", "tableLookupEnabled", "timezone", "updatedAt", "weddingDate" FROM "EventSettings";
DROP TABLE "EventSettings";
ALTER TABLE "new_EventSettings" RENAME TO "EventSettings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "RsvpAnswer_questionId_guestId_key" ON "RsvpAnswer"("questionId", "guestId");

-- CreateIndex
CREATE UNIQUE INDEX "RsvpAnswer_questionId_householdId_key" ON "RsvpAnswer"("questionId", "householdId");
