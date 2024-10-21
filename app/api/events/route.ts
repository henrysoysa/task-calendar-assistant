import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import * as admin from 'firebase-admin';

console.log('Project ID:', process.env.FIREBASE_PROJECT_ID);
console.log('Client Email:', process.env.FIREBASE_CLIENT_EMAIL);
console.log('Private Key Length:', process.env.FIREBASE_PRIVATE_KEY?.length);

const prisma = new PrismaClient();

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
    console.log('Firebase Admin initialized successfully');
  } catch (error) {
    console.error('Error initializing Firebase Admin:', error);
  }
}

export async function GET(req: Request) {
  const token = req.headers.get('Authorization')?.split('Bearer ')[1];
  if (!token) {
    return NextResponse.json({ error: 'No token provided' }, { status: 401 });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    const events = await prisma.task.findMany({
      where: { userId: decodedToken.uid },
    });
    return NextResponse.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const token = request.headers.get('Authorization')?.split('Bearer ')[1];
  if (!token) {
    return NextResponse.json({ error: 'No token provided' }, { status: 401 });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    const { taskName, description, priority, projectId, deadline, timeRequired } = await request.json();
    const newEvent = await prisma.task.create({
      data: {
        taskName,
        description,
        priority,
        projectId,
        deadline,
        timeRequired,
        userId: decodedToken.uid,
      },
    });
    return NextResponse.json(newEvent);
  } catch (error) {
    console.error('Error adding event:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
