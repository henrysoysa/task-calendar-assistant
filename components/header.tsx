"use client";

import React from 'react';
import Link from 'next/link';
import { useClerk, SignedIn, SignedOut } from '@clerk/nextjs';
import { Button } from './ui/button';

const Header: React.FC = () => {
  const { signOut } = useClerk();

  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <Link 
            href="/" 
            className="text-xl font-bold text-gray-800 hover:text-gray-600 transition-colors"
          >
            Calendar Assistant
          </Link>
          
          <div className="flex items-center space-x-4">
            <SignedIn>
              <Button 
                onClick={() => signOut()}
                variant="ghost"
                className="text-gray-600 hover:text-gray-900"
              >
                Sign Out
              </Button>
            </SignedIn>
            <SignedOut>
              {/* Sign In button is handled by layout */}
            </SignedOut>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
