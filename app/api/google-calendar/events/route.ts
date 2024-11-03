import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { userId } = getAuth(request);

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get user's credentials
    const credentials = await prisma.googleCalendarCredentials.findUnique({
      where: { userId }
    });

    if (!credentials) {
      return NextResponse.json([]);
    }

    // Get all events for this user's credentials
    const events = await prisma.googleCalendarEvent.findMany({
      where: {
        credentialsId: credentials.id
      },
      orderBy: {
        startTime: 'asc'
      }
    });

    console.log('Found events:', events.length);
    return NextResponse.json(events);
  } catch (error) {
    console.error('Error fetching Google Calendar events:', error);
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  }
} 