import React from 'react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { Button } from './ui/button';

const SignIn: React.FC = () => {
  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      console.log('Sign-in successful:', result.user);
      // The AuthContext will handle the state update
    } catch (error) {
      console.error('Error signing in with Google', error);
    }
  };

  return (
    <Button onClick={signInWithGoogle}>
      Sign in with Google
    </Button>
  );
};

export default SignIn;
