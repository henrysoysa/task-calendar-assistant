import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  const { userId } = getAuth(request);

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Delete credentials and associated events
    await prisma.$transaction([
      prisma.googleCalendarEvent.deleteMany({
        where: {
          credentials: {
            userId: userId
          }
        }
      }),
      prisma.googleCalendarCredentials.delete({
        where: {
          userId: userId
        }
      })
    ]);

    return NextResponse.json({ status: 'success' });
  } catch (error) {
    console.error('Error disconnecting Google Calendar:', error);
    return NextResponse.json({ 
      error: 'Failed to disconnect Google Calendar',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 