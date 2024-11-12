import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { prisma } from '@/lib/prisma';

export async function POST() {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find and delete the Google Calendar credentials
    const deletedCredentials = await prisma.googleCalendarCredentials.deleteMany({
      where: { userId: userId },
    });

    if (!deletedCredentials.count) {
      return NextResponse.json({ error: 'No Google Calendar connection found' }, { status: 404 });
    }

    // The associated GoogleCalendarEvents will be automatically deleted due to the onDelete: Cascade setting

    return NextResponse.json({ message: 'Google Calendar disconnected successfully' });
  } catch (error) {
    console.error('Error disconnecting Google Calendar:', error);
    return NextResponse.json({ error: 'Failed to disconnect Google Calendar' }, { status: 500 });
  }
}