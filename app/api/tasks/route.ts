import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { getAuth } from '@clerk/nextjs/server';
import { NextRequest } from 'next/server';
import { schedulingUtils, SchedulingConflictError } from '../../../lib/scheduling';

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
      orderBy: [
        { deadline: 'asc' },
        { priority: 'desc' },
        { timeRequired: 'asc' }
      ],
    });

    // Convert to Event format for scheduling check
    const scheduledEvents = existingTasks.map(task => ({
      start: task.deadline,
      end: new Date(task.deadline.getTime() + task.timeRequired * 60000)
    }));

    // Check for scheduling conflicts
    const newTask = {
      id: 0,
      taskName: body.taskName,
      deadline: new Date(body.deadline),
      timeRequired: body.timeRequired,
      priority: body.priority
    };

    if (!schedulingUtils.canScheduleTask(newTask, scheduledEvents)) {
      // Find alternative slots considering priority
      const alternativeSlots = schedulingUtils.suggestAlternativeSlots(newTask, scheduledEvents);
      
      return NextResponse.json({
        error: 'Scheduling conflict detected',
        alternativeSlots,
        message: `Task "${body.taskName}" conflicts with existing tasks. Alternative time slots have been suggested.`
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
      },
    });

    return NextResponse.json(createdTask);
  } catch (error) {
    console.error('Error creating task:', error);
    if (error instanceof SchedulingConflictError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
