import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { prisma } from '../../../../lib/prisma';
import { NextRequest } from 'next/server';
import { google } from 'googleapis';

export async function POST(request: NextRequest) {
  const { userId } = getAuth(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const credentials = await prisma.googleCalendarCredentials.findUnique({
      where: { userId },
    });

    if (!credentials) {
      return NextResponse.json(
        { error: 'Google Calendar not connected' },
        { status: 404 }
      );
    }

    // Initialize Google Calendar API
    const oauth2Client = new google.auth.OAuth2(
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    oauth2Client.setCredentials({
      access_token: credentials.accessToken,
      refresh_token: credentials.refreshToken || undefined,
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    try {
      // Get events from primary calendar for the next 30 days
      const now = new Date();
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin: now.toISOString(),
        timeMax: thirtyDaysFromNow.toISOString(),
        maxResults: 100,
        singleEvents: true,
        orderBy: 'startTime',
      });

      const events = response.data.items;

      if (!events || events.length === 0) {
        await prisma.googleCalendarCredentials.update({
          where: { userId },
          data: { lastSyncedAt: new Date() },
        });

        return NextResponse.json({ 
          success: true, 
          eventsCount: 0 
        });
      }

      // Delete existing events in a transaction
      await prisma.$transaction(async (tx) => {
        await tx.googleCalendarEvent.deleteMany({
          where: { credentialsId: credentials.id },
        });

        // Create new events
        for (const event of events) {
          if (event.id && (event.start?.dateTime || event.start?.date)) {
            const startTime = event.start.dateTime 
              ? new Date(event.start.dateTime)
              : new Date(event.start.date!);
            
            const endTime = event.end?.dateTime
              ? new Date(event.end.dateTime)
              : new Date(event.end?.date!);

            await tx.googleCalendarEvent.create({
              data: {
                googleEventId: event.id,
                title: event.summary || 'Untitled Event',
                description: event.description || '',
                startTime,
                endTime,
                isAllDay: !event.start.dateTime,
                isRecurring: !!event.recurringEventId,
                recurringEventId: event.recurringEventId || null,
                credentialsId: credentials.id,
              },
            });
          }
        }

        await tx.googleCalendarCredentials.update({
          where: { userId },
          data: { lastSyncedAt: new Date() },
        });
      });

      return NextResponse.json({ 
        success: true, 
        eventsCount: events.length 
      });

    } catch (error) {
      console.error('Error fetching Google Calendar events:', error);
      throw error;
    }

  } catch (error) {
    console.error('Error syncing calendar:', error);
    return NextResponse.json(
      { 
        error: 'Failed to sync', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
} 