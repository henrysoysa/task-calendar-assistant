"use client";

import React from 'react';
import { useUser, SignedIn, SignedOut } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import PreferencesSection from '@/components/preferences-section';
import GoogleCalendarIntegration from '@/components/google-calendar-integration';
import { auth } from '@clerk/nextjs';
import { redirect } from 'next/navigation';

const AccountPage = () => {
  const { user, isLoaded } = useUser();
  const { userId } = auth();

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  if (!userId) {
    redirect('/sign-in');
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <SignedIn>
        {/* Account Information Section */}
        <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Account Information</h1>
          </div>
          
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold mb-2">Profile</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-600">Email</p>
                  <p className="font-medium">
                    {user?.primaryEmailAddress?.emailAddress || 'No email provided'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Full Name</p>
                  <p className="font-medium">
                    {user?.fullName || 'Not provided'}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold mb-2">Account Created</h2>
              <p className="text-gray-600">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Not available'}
              </p>
            </div>
          </div>
        </div>

        {/* Calendar Integrations */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Calendar Integrations</h2>
          <GoogleCalendarIntegration />
        </div>

        {/* Preferences Section */}
        <PreferencesSection />
      </SignedIn>
      
      <SignedOut>
        <div className="text-center py-12">
          <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-8">
            <h1 className="text-2xl font-bold mb-4">Access Required</h1>
            <p className="text-gray-600 mb-6">
              Please sign in to view your account information and preferences.
            </p>
          </div>
        </div>
      </SignedOut>
    </div>
  );
};

export default AccountPage; 