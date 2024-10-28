import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { getAuth } from '@clerk/nextjs/server';

export async function GET(req: Request) {
  const { userId } = getAuth(req);

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const tasks = await prisma.task.findMany({
      where: { userId: userId },
      include: {
        project: true, // Include the project relation
      },
    });
    return NextResponse.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { userId } = getAuth(request);

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const newTask = await prisma.task.create({
      data: {
        taskName: body.taskName,
        description: body.description,
        priority: body.priority,
        projectId: body.projectId,
        deadline: new Date(body.deadline),
        timeRequired: body.timeRequired,
        userId,
      },
    });
    return NextResponse.json(newTask);
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
