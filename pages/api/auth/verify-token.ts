import { NextApiRequest, NextApiResponse } from 'next';
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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { idToken } = req.body;

  if (!idToken) {
    return res.status(400).json({ error: 'No ID token provided' });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
    const sessionCookie = await admin.auth().createSessionCookie(idToken, { expiresIn });

    res.setHeader(
      'Set-Cookie',
      `session=${sessionCookie}; Max-Age=${expiresIn}; Path=/; HttpOnly; Secure; SameSite=Strict`
    );

    // Set another cookie with the user ID
    res.setHeader(
      'Set-Cookie',
      `userId=${decodedToken.uid}; Max-Age=${expiresIn}; Path=/; HttpOnly; Secure; SameSite=Strict`
    );

    return res.status(200).json({ status: 'success', userId: decodedToken.uid });
  } catch (error) {
    console.error('Error verifying token:', error);
    return res.status(401).json({ error: 'Invalid token' });
  }
}
