-- CreateTable
CREATE TABLE "ScheduleItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "time" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "location" TEXT,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
