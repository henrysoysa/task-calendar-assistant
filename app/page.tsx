"use client";

import React from 'react';
import CalendarView from '../components/calendar-view';
import { useAuthContext } from '../contexts/AuthContext';

export default function Home() {
  const { userId, loading } = useAuthContext();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!userId) {
    return (
    <div>
    <h3>Welcome to the Calendar Assistant. Sign in to view the application.</h3>
    </div>
    );
  }

  if (userId) {
    return (
      <main>
        <h3 className="text-2xl font-bold mb-4">Your Calendar Assistant</h3>
        <CalendarView />
      </main>
    );
  }


}
