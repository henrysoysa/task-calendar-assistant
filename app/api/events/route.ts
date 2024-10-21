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

    const tasks = await prisma.task.findMany({
      where: { userId: userId },
      include: { project: true },
    });
    return NextResponse.json({ tasks });
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
    if (body.type === 'task') {
      const { taskName, description, priority, projectId, deadline, timeRequired } = body;
      
      // Ensure projectId is a number
      const projectIdNumber = parseInt(projectId, 10);
      if (isNaN(projectIdNumber)) {
        return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
      }

      // Check if the project exists
      const project = await prisma.project.findUnique({
        where: { id: projectIdNumber },
      });

      if (!project) {
        return NextResponse.json({ error: 'Project not found' }, { status: 400 });
      }

      // Parse the deadline string to a Date object
      const deadlineDate = new Date(deadline);

      const newTask = await prisma.task.create({
        data: {
          taskName,
          description,
          priority,
          projectId: projectIdNumber,
          deadline: deadlineDate,
          timeRequired,
          userId,
        },
      });
      return NextResponse.json(newTask);
    } else {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error adding task:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
