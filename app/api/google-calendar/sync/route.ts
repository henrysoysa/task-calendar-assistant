import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { getAuth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  const { userId } = getAuth(request);

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log('Starting sync for user:', userId);
    
    // Get user's Google Calendar credentials
    const credentials = await prisma.googleCalendarCredentials.findUnique({
      where: { userId }
    });

    if (!credentials) {
      return NextResponse.json({ error: 'Google Calendar not connected' }, { status: 400 });
    }

    // Initialize Google Calendar API
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    oauth2Client.setCredentials({ 
      access_token: credentials.accessToken,
      refresh_token: credentials.refreshToken 
    });
    
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // Get events from the last month to next month
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    const oneMonthAhead = new Date();
    oneMonthAhead.setMonth(oneMonthAhead.getMonth() + 1);

    console.log('Fetching events from:', oneMonthAgo, 'to:', oneMonthAhead);

    const events = await calendar.events.list({
      calendarId: 'primary',
      timeMin: oneMonthAgo.toISOString(),
      timeMax: oneMonthAhead.toISOString(),
      maxResults: 2500,
      singleEvents: true,
      orderBy: 'startTime',
    });

    console.log('Found events:', events.data.items?.length);

    // Convert and save events
    if (events.data.items?.length) {
      const formattedEvents = events.data.items.map(event => ({
        googleCalendarEventId: event.id!,
        credentialsId: credentials.id,
        title: event.summary || 'Untitled Event',
        description: event.description,
        startTime: new Date(event.start?.dateTime || event.start?.date!),
        endTime: new Date(event.end?.dateTime || event.end?.date!),
        isRecurring: !!event.recurringEventId,
        recurringEventId: event.recurringEventId
      }));

      // Delete existing events and insert new ones
      await prisma.$transaction([
        prisma.googleCalendarEvent.deleteMany({
          where: { credentialsId: credentials.id }
        }),
        prisma.googleCalendarEvent.createMany({
          data: formattedEvents
        })
      ]);

      // Update last sync time
      await prisma.googleCalendarCredentials.update({
        where: { id: credentials.id },
        data: { lastSyncedAt: new Date() }
      });

      console.log('Successfully synced events:', formattedEvents.length);
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