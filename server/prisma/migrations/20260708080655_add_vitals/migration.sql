-- CreateTable
CREATE TABLE "Vitals" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "patientId" INTEGER NOT NULL,
    "temperature" REAL NOT NULL,
    "bloodPress" TEXT NOT NULL,
    "pulseRate" INTEGER NOT NULL,
    "spo2" INTEGER NOT NULL,
    "weight" REAL,
    "recordedBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Vitals_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
