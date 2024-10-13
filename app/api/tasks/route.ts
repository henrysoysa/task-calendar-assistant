import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function GET() {
  try {
    const tasks = await prisma.task.findMany({
      include: { project: true },
      orderBy: { deadline: 'asc' },
    });
    return NextResponse.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json({ error: 'Error fetching tasks' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('Received task data:', body);

    let project = await prisma.project.findUnique({
      where: { name: body.project },
    });

    if (!project) {
      project = await prisma.project.create({
        data: { name: body.project },
      });
    }

    const task = await prisma.task.create({
      data: {
        userId: body.userId,
        taskName: body.taskName,
        description: body.description,
        priority: body.priority,
        projectId: project.id,
        deadline: new Date(body.deadline),
        timeRequired: body.timeRequired,
      },
      include: { project: true },
    });
    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json({ error: `Error creating task: ${(error as Error).message}` }, { status: 500 });
  }
}
