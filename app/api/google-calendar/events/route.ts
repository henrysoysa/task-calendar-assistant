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
    console.log('Fetching Google Calendar events for user:', userId);

    const events = await prisma.googleCalendarEvent.findMany({
      where: {
        credentials: {
          userId: userId
        }
      },
      include: {
        credentials: true
      },
      orderBy: {
        startTime: 'asc'
      }
    });

    console.log('Found events:', events.length);

    return NextResponse.json(events);
  } catch (error) {
    console.error('Error fetching Google Calendar events:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch events',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 