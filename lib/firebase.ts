import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

console.log('Firebase Config:', firebaseConfig);

let app: FirebaseApp;
let auth: Auth;

const startTime = Date.now();
try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  console.log(`Firebase initialized successfully in ${Date.now() - startTime}ms`);
} catch (error) {
  console.error('Error initializing Firebase:', error);
}

export { auth };
