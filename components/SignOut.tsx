import React from 'react';
import { useClerk } from '@clerk/nextjs';
import { Button } from './ui/button';

const SignOut: React.FC = () => {
  const { signOut } = useClerk();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <Button onClick={handleSignOut}>
      Sign Out
    </Button>
  );
};

export default SignOut;
