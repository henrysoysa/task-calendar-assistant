import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { getAuth } from '@clerk/nextjs/server';
import { NextRequest } from 'next/server';
import { scheduleTask, hasOverlap } from '../../../lib/scheduling';

export async function GET(req: NextRequest) {
  const { userId } = getAuth(req);

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
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

    // Debug logging
    console.log('Tasks found:', tasks.length);
    
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
    
    // Get existing events and tasks for the user
    const existingTasks = await prisma.task.findMany({
      where: { 
        userId,
        deadline: {
          gte: new Date()
        }
      },
      select: {
        deadline: true,
        timeRequired: true,
        priority: true,
      },
    });

    // Convert to Event format for scheduling check
    const scheduledEvents = existingTasks.map(task => ({
      start: new Date(task.deadline.getTime() - task.timeRequired * 60000),
      end: task.deadline
    }));

    // Check for scheduling conflicts
    const newTask = {
      id: 0,
      taskName: body.taskName,
      deadline: new Date(body.deadline),
      timeRequired: body.timeRequired,
      priority: body.priority
    };

    // Get scheduled time for new task
    const scheduledTime = scheduleTask(newTask, scheduledEvents);
    
    // Check for conflicts
    const hasConflict = scheduledEvents.some(event => 
      hasOverlap(
        { start: scheduledTime.start, end: scheduledTime.end },
        { start: event.start, end: event.end }
      )
    );

    if (hasConflict) {
      return NextResponse.json({
        error: 'Scheduling conflict detected',
        message: `Task "${body.taskName}" conflicts with existing tasks.`
      }, { status: 409 });
    }

    // If no conflicts, create the task
    const createdTask = await prisma.task.create({
      data: {
        taskName: body.taskName,
        description: body.description,
        priority: body.priority,
        projectId: body.projectId,
        deadline: new Date(body.deadline),
        timeRequired: body.timeRequired,
        userId,
        status: 'NOT_STARTED',
      },
    });

    return NextResponse.json(createdTask);
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json({ 
      error: 'Internal Server Error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
