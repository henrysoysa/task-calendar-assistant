"use client";

import React from 'react';
import { useClerk, SignedIn, SignedOut } from '@clerk/nextjs';
import { Button } from './ui/button';

export const SignInWithClerk: React.FC = () => {
  const { openSignIn } = useClerk();

  return (
    <div className="flex justify-center my-4">
      <SignedOut>
        <Button 
          onClick={() => openSignIn()}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
        >
          Sign in with Clerk
        </Button>
      </SignedOut>
      <SignedIn>
        {/* Content for signed-in users */}
      </SignedIn>
    </div>
  );
}; 