import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { getAuth } from '@clerk/nextjs/server';

export async function GET(req: Request) {
  const { userId } = getAuth(req);

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
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
  const { userId } = getAuth(request);

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { name } = await request.json();

    // Check if the project already exists
    const existingProject = await prisma.project.findUnique({
      where: {
        userId_name: {
          userId,
          name,
        },
      },
    });

    if (existingProject) {
      return NextResponse.json({ error: 'Project already exists' }, { status: 400 });
    }

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
