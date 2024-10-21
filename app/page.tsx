"use client";

import React from 'react';
import CalendarView from '../components/calendar-view';

export default function Home() {
  return (
    <main>
      <h1 className="text-2xl font-bold mb-4">Welcome to the Calendar Assistant</h1>
      <CalendarView />
    </main>
  );
}
