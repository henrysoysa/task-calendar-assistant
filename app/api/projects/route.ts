import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';
import admin from '../../../lib/firebase-admin';

const prisma = new PrismaClient();

export async function GET(req: Request) {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get('session')?.value;

  if (!sessionCookie) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const decodedClaims = await admin.auth().verifySessionCookie(sessionCookie, true);
    const userId = decodedClaims.uid;

    const projects = await prisma.project.findMany({
      where: { userId: userId },
    });
    return NextResponse.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get('session')?.value;

  if (!sessionCookie) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const decodedClaims = await admin.auth().verifySessionCookie(sessionCookie, true);
    const userId = decodedClaims.uid;

    const { name } = await request.json();
    const newProject = await prisma.project.create({
      data: {
        name,
        userId,
      },
    });
    return NextResponse.json(newProject);
  } catch (error) {
    console.error('Error adding project:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
