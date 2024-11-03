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
    const credentials = await prisma.googleCalendarCredentials.findUnique({
      where: { userId }
    });

    return NextResponse.json({
      isConnected: !!credentials,
      lastSync: credentials?.lastSyncedAt
    });
  } catch (error) {
    console.error('Error checking Google Calendar status:', error);
    return NextResponse.json({ error: 'Failed to check status' }, { status: 500 });
  }
} 