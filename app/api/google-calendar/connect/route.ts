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
    const body = await request.json();
    const { token, refreshToken } = body;

    // Create or update Google Calendar credentials
    const credentials = await prisma.googleCalendarCredentials.upsert({
      where: {
        userId: userId,
      },
      update: {
        accessToken: token,
        refreshToken: refreshToken,
        updatedAt: new Date(),
      },
      create: {
        userId: userId,
        accessToken: token,
        refreshToken: refreshToken,
      },
    });

    // Trigger initial sync
    const syncResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/google-calendar/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!syncResponse.ok) {
      console.error('Failed to trigger initial sync');
    }

    return NextResponse.json({
      status: 'success',
      credentialsId: credentials.id
    });

  } catch (error) {
    console.error('Error connecting Google Calendar:', error);
    return NextResponse.json({ 
      error: 'Failed to connect Google Calendar',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 