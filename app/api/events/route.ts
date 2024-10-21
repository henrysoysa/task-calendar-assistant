import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const events = await prisma.event.findMany();
    return NextResponse.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { title, start, end } = await request.json();
    const newEvent = await prisma.event.create({
      data: {
        title,
        start,
        end,
      },
    });
    return NextResponse.json(newEvent);
  } catch (error) {
    console.error('Error adding event:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
