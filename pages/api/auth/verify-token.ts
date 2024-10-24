import { NextApiRequest, NextApiResponse } from 'next';
import * as admin from 'firebase-admin';
import { serialize } from 'cookie';

// Initialize Firebase Admin SDK
const initializeFirebaseAdmin = () => {
  if (!admin.apps.length) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
      });
      console.log('Firebase Admin initialized successfully');
    } catch (error) {
      console.error('Error initializing Firebase Admin:', error);
      throw error;
    }
  }
  return admin;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { idToken, csrfToken } = req.body;

  if (!idToken || !csrfToken) {
    return res.status(400).json({ error: 'No ID token or CSRF token provided' });
  }

  // Guard against CSRF attacks
  if (csrfToken !== req.cookies.csrfToken) {
    return res.status(401).json({ error: 'UNAUTHORIZED REQUEST!' });
  }

  try {
    console.log('Attempting to initialize Firebase Admin');
    const adminSDK = initializeFirebaseAdmin();
    
    console.log('Attempting to verify token');
    const decodedToken = await adminSDK.auth().verifyIdToken(idToken);
    console.log('Token verified successfully', decodedToken);
    
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
    console.log('Creating session cookie');
    const sessionCookie = await adminSDK.auth().createSessionCookie(idToken, { expiresIn });
    console.log('Session Cookie created');

    // Set cookie policy for session cookie
    const options = { maxAge: expiresIn, httpOnly: true, secure: true, path: '/', sameSite: 'strict' };
    res.setHeader('Set-Cookie', serialize('session', sessionCookie, options));

    return res.status(200).json({ status: 'success', userId: decodedToken.uid });
  } catch (error) {
    console.error('Error verifying token:', error);
    return res.status(401).json({ error: 'Invalid token' });
  }
}
