"use client";

import React from 'react';
import { useUser, SignedIn, SignedOut } from '@clerk/nextjs';

const AccountPage = () => {
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <SignedIn>
        <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
          <h1 className="text-2xl font-bold mb-6">Account Information</h1>
          
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
              <h2 className="text-lg font-semibold mb-2">Account Details</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-600">User ID</p>
                  <p className="font-medium">{user?.id || 'Not available'}</p>
                </div>
                <div>
                  <p className="text-gray-600">Created</p>
                  <p className="font-medium">
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Not available'}
                  </p>
                </div>
              </div>
            </div>

            {user?.organizationMemberships && user.organizationMemberships.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-2">Organizations</h2>
                <div className="space-y-2">
                  {user.organizationMemberships.map((membership) => (
                    <div key={membership.organization.id} className="p-3 bg-gray-50 rounded">
                      <p className="font-medium">{membership.organization.name}</p>
                      <p className="text-sm text-gray-600">Role: {membership.role}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </SignedIn>
      
      <SignedOut>
        <div className="text-center py-12">
          <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-8">
            <h1 className="text-2xl font-bold mb-4">Access Required</h1>
            <p className="text-gray-600 mb-6">
              Please sign-up or login to continue. You can find the sign-in button in the header above.
            </p>
            <div className="p-4 bg-blue-50 rounded-md">
              <p className="text-sm text-blue-800">
                Create an account or sign in to view your account information and access all features.
              </p>
            </div>
          </div>
        </div>
      </SignedOut>
    </div>
  );
};

export default AccountPage; 