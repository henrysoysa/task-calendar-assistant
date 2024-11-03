import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { getAuth } from '@clerk/nextjs/server';
import { NextRequest } from 'next/server';
import { scheduleTask, hasOverlap } from '../../../lib/scheduling';
import { Task } from '@/types';

export async function GET(req: NextRequest) {
  const { userId } = getAuth(req);

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log('Fetching tasks for user:', userId);
    const tasks = await prisma.task.findMany({
      where: { userId: userId },
      include: {
        project: true,
      },
      orderBy: [
        { deadline: 'asc' },
        { priority: 'desc' },
        { timeRequired: 'asc' }
      ],
    });
    
    console.log('Found tasks:', tasks);
    return NextResponse.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { userId } = getAuth(request);

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    
    // Create new task with required fields
    const newTask: Task = {
      id: 0, // This will be set by the database
      taskName: body.taskName,
      deadline: new Date(body.deadline),
      timeRequired: body.timeRequired,
      priority: body.priority,
      status: 'NOT_STARTED',
      userId: userId,
      description: body.description || null
    };

    // Get scheduled time for new task
    const scheduledTime = scheduleTask(newTask, []);
    
    // Create the task
    const createdTask = await prisma.task.create({
      data: {
        taskName: body.taskName,
        description: body.description,
        priority: body.priority,
        projectId: body.projectId,
        deadline: new Date(body.deadline),
        timeRequired: body.timeRequired,
        userId,
        status: 'NOT_STARTED'
      },
    });

    return NextResponse.json(createdTask);
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
