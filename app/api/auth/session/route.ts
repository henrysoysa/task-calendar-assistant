import { NextResponse } from 'next/server';
import * as admin from 'firebase-admin';

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

export async function GET(request: Request) {
  const sessionCookie = request.headers.get('Cookie')?.split('; ').find(row => row.startsWith('session='))?.split('=')[1];

  if (!sessionCookie) {
    return NextResponse.json({ isLoggedIn: false });
  }

  try {
    const decodedClaims = await admin.auth().verifySessionCookie(sessionCookie, true);
    return NextResponse.json({ isLoggedIn: true, user: decodedClaims });
  } catch (error) {
    return NextResponse.json({ isLoggedIn: false });
  }
}
