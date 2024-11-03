"use client";

import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { useUser } from '@clerk/nextjs';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar.events.readonly'
].join(' ');

declare global {
  interface Window {
    gapi: any;
  }
}

const GoogleCalendarIntegration: React.FC<{ onSync: () => void }> = ({ onSync }) => {
  const { user } = useUser();
  const [isConnected, setIsConnected] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  useEffect(() => {
    // Load the Google API client library
    const loadGoogleApi = () => {
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => {
        window.gapi.load('client:auth2', initClient);
      };
      document.body.appendChild(script);
    };

    loadGoogleApi();
  }, []);

  const initClient = () => {
    window.gapi.client.init({
      clientId: GOOGLE_CLIENT_ID,
      scope: SCOPES,
      plugin_name: 'calendar_assistant'
    }).then(() => {
      // Check if already authenticated
      if (window.gapi.auth2.getAuthInstance().isSignedIn.get()) {
        setIsConnected(true);
        checkLastSync();
      }
    });
  };

  const checkLastSync = async () => {
    try {
      const response = await fetch('/api/google-calendar/last-sync');
      if (response.ok) {
        const data = await response.json();
        setLastSync(data.lastSync ? new Date(data.lastSync) : null);
      }
    } catch (error) {
      console.error('Error checking last sync:', error);
    }
  };

  const handleConnect = async () => {
    try {
      const auth = window.gapi.auth2.getAuthInstance();
      const googleUser = await auth.signIn();
      const authResponse = googleUser.getAuthResponse();
      
      // Send token to backend
      const response = await fetch('/api/google-calendar/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: authResponse.access_token,
          userId: user?.id
        }),
      });

      if (response.ok) {
        setIsConnected(true);
        await syncEvents();
      }
    } catch (error) {
      console.error('Error connecting to Google Calendar:', error);
    }
  };

  const handleDisconnect = async () => {
    try {
      const auth = window.gapi.auth2.getAuthInstance();
      await auth.signOut();
      
      const response = await fetch('/api/google-calendar/disconnect', {
        method: 'POST',
      });

      if (response.ok) {
        setIsConnected(false);
        setLastSync(null);
      }
    } catch (error) {
      console.error('Error disconnecting from Google Calendar:', error);
    }
  };

  const syncEvents = async () => {
    try {
      console.log('Starting Google Calendar sync...');
      const response = await fetch('/api/google-calendar/sync', {
        method: 'POST',
      });

      if (response.ok) {
        console.log('Sync successful');
        setLastSync(new Date());
        onSync(); // Call the callback to refresh calendar view
      } else {
        const error = await response.json();
        console.error('Sync failed:', error);
      }
    } catch (error) {
      console.error('Error syncing events:', error);
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-sm">
      <h2 className="text-lg font-semibold mb-4">Google Calendar Integration</h2>
      
      {!isConnected ? (
        <Button
          onClick={handleConnect}
          className="bg-violet-600 hover:bg-violet-700 text-white"
        >
          Connect Google Calendar
        </Button>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">
              Connected to Google Calendar
              {lastSync && (
                <span className="block text-xs">
                  Last synced: {lastSync.toLocaleString()}
                </span>
              )}
            </span>
            <div className="space-x-2">
              <Button
                onClick={syncEvents}
                variant="outline"
                className="text-violet-600 hover:text-violet-800"
              >
                Sync Now
              </Button>
              <Button
                onClick={handleDisconnect}
                variant="outline"
                className="text-red-600 hover:text-red-800"
              >
                Disconnect
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoogleCalendarIntegration; 