-- AlterTable
ALTER TABLE "Task" ALTER COLUMN "status" DROP NOT NULL;

-- CreateTable
CREATE TABLE "GoogleCalendarCredentials" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "expiryDate" TIMESTAMP(3),
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GoogleCalendarCredentials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoogleCalendarEvent" (
    "id" SERIAL NOT NULL,
    "googleCalendarEventId" TEXT NOT NULL,
    "credentialsId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "isAllDay" BOOLEAN NOT NULL DEFAULT false,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "recurringEventId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GoogleCalendarEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GoogleCalendarCredentials_userId_key" ON "GoogleCalendarCredentials"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "GoogleCalendarEvent_googleCalendarEventId_key" ON "GoogleCalendarEvent"("googleCalendarEventId");

-- AddForeignKey
ALTER TABLE "GoogleCalendarEvent" ADD CONSTRAINT "GoogleCalendarEvent_credentialsId_fkey" FOREIGN KEY ("credentialsId") REFERENCES "GoogleCalendarCredentials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
