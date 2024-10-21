"use client";

import React from 'react';
import CalendarView from '../components/calendar-view';
import { useAuth } from '../contexts/AuthContext';

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <main>
      <h1 className="text-2xl font-bold mb-4">Welcome to the Calendar Assistant</h1>
      <CalendarView />
    </main>
  );
}
