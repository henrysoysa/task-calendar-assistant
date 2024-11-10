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
    const { token, refreshToken } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: 'Access token is required' },
        { status: 400 }
      );
    }

    const credentials = await prisma.googleCalendarCredentials.upsert({
      where: { userId },
      update: {
        accessToken: token,
        ...(refreshToken && { refreshToken }),
        updatedAt: new Date(),
      },
      create: {
        userId,
        accessToken: token,
        refreshToken: refreshToken || '',
      },
    });

    return NextResponse.json({ success: true, credentials });
  } catch (error) {
    console.error('Error connecting Google Calendar:', error);
    return NextResponse.json(
      { error: 'Failed to connect', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 