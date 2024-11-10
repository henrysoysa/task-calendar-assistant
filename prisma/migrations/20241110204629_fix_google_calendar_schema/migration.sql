-- DropForeignKey
ALTER TABLE "GoogleCalendarEvent" DROP CONSTRAINT "GoogleCalendarEvent_credentialsId_fkey";

-- CreateIndex
CREATE INDEX "GoogleCalendarEvent_credentialsId_idx" ON "GoogleCalendarEvent"("credentialsId");

-- AddForeignKey
ALTER TABLE "GoogleCalendarEvent" ADD CONSTRAINT "GoogleCalendarEvent_credentialsId_fkey" FOREIGN KEY ("credentialsId") REFERENCES "GoogleCalendarCredentials"("id") ON DELETE CASCADE ON UPDATE CASCADE;
