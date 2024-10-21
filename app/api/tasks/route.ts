import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { cookies } from 'next/headers';
import admin from '../../../lib/firebase-admin';

export async function GET(req: Request) {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get('session')?.value;

  if (!sessionCookie) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const decodedClaims = await admin.auth().verifySessionCookie(sessionCookie, true);
    const userId = decodedClaims.uid;

    const tasks = await prisma.task.findMany({
      where: { userId: userId },
      include: { project: true },
    });
    return NextResponse.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
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

    const body = await request.json();

    let project = await prisma.project.findFirst({
      where: { 
        name: body.project,
        userId: userId
      },
    });

    if (!project) {
      project = await prisma.project.create({
        data: {
          name: body.project,
          userId: userId,
        },
      });
    }

    const task = await prisma.task.create({
      data: {
        taskName: body.taskName,
        description: body.description,
        priority: body.priority,
        projectId: project.id,
        deadline: new Date(body.deadline),
        timeRequired: body.timeRequired,
        userId: userId,
      },
    });

    return NextResponse.json(task);
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
