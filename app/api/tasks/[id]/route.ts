import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { prisma } from '../../../../lib/prisma';
import { NextRequest } from 'next/server';

// Get a specific task
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userId } = getAuth(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const task = await prisma.task.findFirst({
      where: {
        id: parseInt(params.id),
        userId,
      },
      include: {
        project: true,
      },
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error('Error fetching task:', error);
    return NextResponse.json(
      { error: 'Failed to fetch task' },
      { status: 500 }
    );
  }
}

// Update a task
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userId } = getAuth(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const {
      taskName,
      description,
      priority,
      projectId,
      deadline,
      timeRequired,
      status,
    } = await request.json();

    const task = await prisma.task.updateMany({
      where: {
        id: parseInt(params.id),
        userId,
      },
      data: {
        taskName,
        description,
        priority,
        projectId,
        deadline: new Date(deadline),
        timeRequired,
        status,
      },
    });

    return NextResponse.json(task);
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json(
      { error: 'Failed to update task' },
      { status: 500 }
    );
  }
}

// Delete a task
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userId } = getAuth(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await prisma.task.deleteMany({
      where: {
        id: parseInt(params.id),
        userId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json(
      { error: 'Failed to delete task' },
      { status: 500 }
    );
  }
}

// Add PATCH method for updating tasks
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userId } = getAuth(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const {
      taskName,
      description,
      priority,
      projectId,
      deadline,
      timeRequired,
      status,
    } = await request.json();

    const task = await prisma.task.updateMany({
      where: {
        id: parseInt(params.id),
        userId,
      },
      data: {
        taskName,
        description,
        priority,
        projectId: projectId || undefined,
        deadline: deadline ? new Date(deadline) : undefined,
        timeRequired,
        status,
      },
    });

    if (task.count === 0) {
      return NextResponse.json(
        { error: 'Task not found or unauthorized' },
        { status: 404 }
      );
    }

    // Fetch and return the updated task
    const updatedTask = await prisma.task.findFirst({
      where: {
        id: parseInt(params.id),
        userId,
      },
      include: {
        project: true,
      },
    });

    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json(
      { error: 'Failed to update task' },
      { status: 500 }
    );
  }
} 