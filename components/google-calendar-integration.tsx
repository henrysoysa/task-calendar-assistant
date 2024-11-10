"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useUser } from '@clerk/nextjs';
import { Calendar, RefreshCw } from 'lucide-react';

// Declare global type for Google API
declare global {
  interface Window {
    gapi: any;
  }
}

// Use existing environment variable
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar.events.readonly'
].join(' ');

const GoogleCalendarIntegration: React.FC = () => {
  const { user } = useUser();
  const [isConnected, setIsConnected] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) {
      console.error('Google Client ID is not configured');
      return;
    }

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
    checkConnectionStatus();
  }, []);

  const initClient = () => {
    if (!GOOGLE_CLIENT_ID) return;

    window.gapi.client.init({
      clientId: GOOGLE_CLIENT_ID,
      scope: SCOPES,
      plugin_name: 'calendar_assistant'
    }).then(() => {
      // Check if already authenticated
      if (window.gapi.auth2.getAuthInstance().isSignedIn.get()) {
        setIsConnected(true);
        checkConnectionStatus();
      }
    }).catch((error: any) => {
      console.error('Error initializing Google API client:', error);
    });
  };

  const checkConnectionStatus = async () => {
    try {
      const response = await fetch('/api/google-calendar/status');
      if (response.ok) {
        const data = await response.json();
        setIsConnected(data.isConnected);
        if (data.lastSync) {
          setLastSync(new Date(data.lastSync));
        }
      }
    } catch (error) {
      console.error('Error checking connection status:', error);
    }
  };

  const handleConnect = async () => {
    try {
      setIsLoading(true);
      const auth = window.gapi.auth2.getAuthInstance();
      
      // Configure auth instance to request refresh token
      const options = {
        prompt: 'consent',
        access_type: 'offline'
      };
      
      const googleUser = await auth.signIn(options);
      const authResponse = googleUser.getAuthResponse(true); // true to get refresh token
      
      const response = await fetch('/api/google-calendar/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: authResponse.access_token,
          refreshToken: authResponse.refresh_token || '', // Provide empty string if no refresh token
        }),
      });

      if (response.ok) {
        setIsConnected(true);
        await syncCalendar();
      } else {
        const error = await response.json();
        console.error('Failed to connect:', error);
      }
    } catch (error) {
      console.error('Error connecting to Google Calendar:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      setIsLoading(true);
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
    } finally {
      setIsLoading(false);
    }
  };

  const syncCalendar = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/google-calendar/sync', {
        method: 'POST',
      });

      if (response.ok) {
        setLastSync(new Date());
      }
    } catch (error) {
      console.error('Error syncing calendar:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-violet-500" />
          <h2 className="text-lg font-semibold">Google Calendar</h2>
        </div>
        {isConnected && (
          <span className="text-xs text-gray-500">
            Last synced: {lastSync?.toLocaleString() || 'Never'}
          </span>
        )}
      </div>

      {!isConnected ? (
        <Button
          onClick={handleConnect}
          disabled={isLoading}
          className="w-full bg-violet-600 hover:bg-violet-700 text-white"
        >
          {isLoading ? 'Connecting...' : 'Connect Google Calendar'}
        </Button>
      ) : (
        <div className="space-y-4">
          <div className="flex gap-2">
            <Button
              onClick={syncCalendar}
              disabled={isLoading}
              variant="outline"
              className="flex-1"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Sync Now
            </Button>
            <Button
              onClick={handleDisconnect}
              disabled={isLoading}
              variant="outline"
              className="flex-1 text-red-600 hover:text-red-700"
            >
              Disconnect
            </Button>
          </div>
          <p className="text-sm text-gray-600">
            Your Google Calendar events are automatically synced and considered when scheduling tasks.
          </p>
        </div>
      )}
    </div>
  );
};

export default GoogleCalendarIntegration; 