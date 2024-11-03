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

    return NextResponse.json({
      status: 'success',
      credentialsId: credentials.id
    });
  } catch (error) {
    console.error('Error connecting Google Calendar:', error);
    return NextResponse.json({ error: 'Failed to connect' }, { status: 500 });
  }
} 