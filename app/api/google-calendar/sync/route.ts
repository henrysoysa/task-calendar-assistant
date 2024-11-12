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
      // Try to refresh the token if we have a refresh token
      if (refreshToken) {
        const { tokens } = await oauth2Client.refreshAccessToken();
        await prisma.googleCalendarCredentials.update({
          where: { id: credentials.id },
          data: {
            accessToken: tokens.access_token!,
            refreshToken: tokens.refresh_token || refreshToken,
            expiryDate: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
            lastSyncedAt: new Date(),
          },
        });
        oauth2Client.setCredentials(tokens);
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

      // Save events to database
      if (events) {
        for (const event of events) {
          await prisma.googleCalendarEvent.upsert({
            where: {
              googleEventId: event.id!,
            },
            update: {
              title: event.summary || 'Untitled Event',
              description: event.description || '',
              startTime: new Date(event.start?.dateTime || event.start?.date || ''),
              endTime: new Date(event.end?.dateTime || event.end?.date || ''),
              isAllDay: !event.start?.dateTime,
              updatedAt: new Date(),
            },
            create: {
              googleEventId: event.id!,
              credentialsId: credentials.id,
              title: event.summary || 'Untitled Event',
              description: event.description || '',
              startTime: new Date(event.start?.dateTime || event.start?.date || ''),
              endTime: new Date(event.end?.dateTime || event.end?.date || ''),
              isAllDay: !event.start?.dateTime,
            },
          });
        }
      }

      // Update the lastSyncedAt in the database
      await prisma.googleCalendarCredentials.update({
        where: { id: credentials.id },
        data: {
          lastSyncedAt: now,
        },
      });

      return NextResponse.json({ 
        message: 'Calendar synced successfully', 
        events,
        lastSynced: now.toISOString()
      });
    } catch (error: any) {
      // Check if the error is due to invalid credentials
      if (error.response?.status === 401) {
        return NextResponse.json({ 
          error: 'Invalid credentials', 
          needsReconnect: true 
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