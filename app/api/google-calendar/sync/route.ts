import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { getAuth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';
import { startOfDay, endOfDay, addDays, differenceInHours, isSameHour } from 'date-fns';

export async function POST(request: NextRequest) {
  const { userId } = getAuth(request);

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const credentials = await prisma.googleCalendarCredentials.findUnique({
      where: { userId }
    });

    if (!credentials) {
      return NextResponse.json({ error: 'Google Calendar not connected' }, { status: 400 });
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    oauth2Client.setCredentials({ access_token: credentials.accessToken });
    
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    const oneMonthAhead = new Date();
    oneMonthAhead.setMonth(oneMonthAhead.getMonth() + 1);

    const events = await calendar.events.list({
      calendarId: 'primary',
      timeMin: oneMonthAgo.toISOString(),
      timeMax: oneMonthAhead.toISOString(),
      maxResults: 2500,
      singleEvents: true,
      orderBy: 'startTime',
    });

    if (events.data.items?.length) {
      const formattedEvents = events.data.items.map(event => {
        const isGoogleAllDay = Boolean(event.start?.date);
        let startTime: Date, endTime: Date;
        let isAllDay = isGoogleAllDay;

        if (event.start?.dateTime && event.end?.dateTime) {
          startTime = new Date(event.start.dateTime);
          endTime = new Date(event.end.dateTime);

          const is24HourEvent = differenceInHours(endTime, startTime) === 24;
          const startsAt1AM = startTime.getHours() === 1 && startTime.getMinutes() === 0;
          const endsAt1AM = endTime.getHours() === 1 && endTime.getMinutes() === 0;

          if (is24HourEvent && startsAt1AM && endsAt1AM) {
            isAllDay = true;
            startTime = startOfDay(startTime);
            endTime = startOfDay(endTime);
          }
        } else if (isGoogleAllDay && event.start?.date && event.end?.date) {
          startTime = new Date(event.start.date);
          endTime = new Date(event.end.date);
        } else {
          startTime = new Date();
          endTime = addDays(startTime, 1);
        }

        return {
          googleCalendarEventId: event.id!,
          credentialsId: credentials.id,
          title: event.summary || 'Untitled Event',
          description: event.description || null,
          startTime,
          endTime,
          isAllDay,
          isRecurring: Boolean(event.recurringEventId),
          recurringEventId: event.recurringEventId || null
        };
      });

      await prisma.$transaction([
        prisma.googleCalendarEvent.deleteMany({
          where: { credentialsId: credentials.id }
        }),
        prisma.googleCalendarEvent.createMany({
          data: formattedEvents
        })
      ]);

      await prisma.googleCalendarCredentials.update({
        where: { id: credentials.id },
        data: { lastSyncedAt: new Date() }
      });
    }

    return NextResponse.json({ 
      status: 'success',
      eventsCount: events.data.items?.length || 0
    });
  } catch (error) {
    console.error('Error syncing Google Calendar:', error);
    return NextResponse.json({ 
      error: 'Failed to sync calendar',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 