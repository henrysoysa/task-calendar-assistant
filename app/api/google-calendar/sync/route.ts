import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs';

export async function POST() {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's Google credentials from your database
    const credentials = await prisma.googleCalendarCredentials.findFirst({
      where: { userId: userId },
    });

    if (!credentials) {
      return NextResponse.json({ 
        error: 'Google Calendar not connected', 
        needsReconnect: true 
      }, { status: 401 });
    }

    const { accessToken, refreshToken, expiryDate } = credentials;

    if (!accessToken) {
      return NextResponse.json({ 
        error: 'No access token available', 
        needsReconnect: true 
      }, { status: 401 });
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID!,
      process.env.GOOGLE_CLIENT_SECRET!,
      process.env.GOOGLE_REDIRECT_URI!
    );

    // Set initial credentials
    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken || undefined,
      expiry_date: expiryDate ? expiryDate.getTime() : undefined,
    });

    try {
      // Always try to refresh the token first
      if (refreshToken) {
        const { credentials: newCredentials } = await oauth2Client.refreshAccessToken();
        
        // Update credentials in database
        await prisma.googleCalendarCredentials.update({
          where: { id: credentials.id },
          data: {
            accessToken: newCredentials.access_token!,
            refreshToken: newCredentials.refresh_token || refreshToken,
            expiryDate: newCredentials.expiry_date ? new Date(newCredentials.expiry_date) : null,
            lastSyncedAt: new Date(),
          },
        });

        oauth2Client.setCredentials(newCredentials);
      }

      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
      const now = new Date();
      const oneMonthFromNow = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());

      const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin: now.toISOString(),
        timeMax: oneMonthFromNow.toISOString(),
        maxResults: 100,
        singleEvents: true,
        orderBy: 'startTime',
      });

      const events = response.data.items;

      if (events) {
        // Process each event
        for (const event of events) {
          if (!event.start || !event.end || !event.id) continue;

          const isAllDay = Boolean(event.start.date);
          let startTime: Date, endTime: Date;

          if (isAllDay) {
            if (!event.start.date || !event.end.date) continue;
            
            try {
              startTime = new Date(event.start.date);
              endTime = new Date(event.end.date);

              if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
                console.error('Invalid date for event:', event.id);
                continue;
              }
            } catch (error) {
              console.error('Error parsing dates for event:', event.id, error);
              continue;
            }
          } else {
            const startDateTime = event.start.dateTime || event.start.date;
            const endDateTime = event.end.dateTime || event.end.date;

            if (!startDateTime || !endDateTime) continue;

            try {
              startTime = new Date(startDateTime);
              endTime = new Date(endDateTime);

              if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
                console.error('Invalid datetime for event:', event.id);
                continue;
              }
            } catch (error) {
              console.error('Error parsing datetimes for event:', event.id, error);
              continue;
            }
          }

          try {
            await prisma.googleCalendarEvent.upsert({
              where: {
                googleEventId: event.id
              },
              update: {
                title: event.summary || 'Untitled Event',
                description: event.description || '',
                startTime,
                endTime,
                isAllDay,
                isRecurring: Boolean(event.recurringEventId),
                recurringEventId: event.recurringEventId || null,
                credentialsId: credentials.id,
              },
              create: {
                googleEventId: event.id,
                credentialsId: credentials.id,
                title: event.summary || 'Untitled Event',
                description: event.description || '',
                startTime,
                endTime,
                isAllDay,
                isRecurring: Boolean(event.recurringEventId),
                recurringEventId: event.recurringEventId || null,
              },
            });
          } catch (error) {
            console.error('Error saving event:', event.id, error);
            continue;
          }
        }
      }

      // Fetch saved events to return
      const savedEvents = await prisma.googleCalendarEvent.findMany({
        where: { credentialsId: credentials.id }
      });

      return NextResponse.json({
        message: 'Calendar synced successfully',
        events: savedEvents,
        lastSynced: now.toISOString()
      });

    } catch (error: any) {
      if (error.response?.status === 401) {
        return NextResponse.json({ 
          error: 'Invalid credentials', 
          needsReconnect: true,
          details: error.message
        }, { status: 401 });
      }
      throw error;
    }
  } catch (error) {
    console.error('Error syncing calendar:', error);
    return NextResponse.json({
      error: 'Failed to sync calendar',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 