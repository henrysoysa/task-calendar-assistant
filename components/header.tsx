"use client";

import React from 'react';
import Link from 'next/link';
import { useClerk, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import { Button } from './ui/button';
import FeedbackForm from './feedback-form';

const Header: React.FC = () => {
  const { signOut, openSignIn } = useClerk();

  return (
    <header className="bg-white shadow-sm border-b border-violet-100">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <Link 
            href="/" 
            className="text-xl font-bold text-violet-700 hover:text-violet-600 transition-colors"
          >
            Calendar Assistant
          </Link>
          
          <div className="flex items-center space-x-4">
            <FeedbackForm />
            <Link
              href="/account"
              className="text-violet-600 hover:text-violet-800 transition-colors"
            >
              Account
            </Link>
            <SignedIn>
              <div className="flex items-center gap-4">
                <UserButton afterSignOutUrl="/" />
                <Button 
                  onClick={() => signOut()}
                  variant="ghost"
                  className="text-violet-600 hover:text-violet-800"
                >
                  Sign Out
                </Button>
              </div>
            </SignedIn>
            <SignedOut>
              <Button 
                onClick={() => openSignIn()}
                className="bg-violet-600 hover:bg-violet-700 text-white font-semibold"
              >
                Sign In
              </Button>
            </SignedOut>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
