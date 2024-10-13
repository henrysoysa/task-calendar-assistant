"use client";

import { useState, useCallback } from 'react';
import CalendarView from '../components/calendar-view';
import MonthSelector from '../components/month-selector';
import AddEventButton from '../components/add-event-button';
import TaskList from '../components/task-list';

export default function Home() {
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [refreshKey, setRefreshKey] = useState(0);

  const refreshTasks = useCallback(() => {
    setRefreshKey(prevKey => prevKey + 1);
  }, []);

  return (
    <div className="flex flex-col min-h-screen p-8">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Calendar Overview</h1>
        <MonthSelector viewMode={viewMode} setViewMode={setViewMode} />
      </header>
      <main className="flex-grow">
        <CalendarView viewMode={viewMode} />
        <AddEventButton onEventAdded={refreshTasks} />
        <TaskList refreshKey={refreshKey} />
      </main>
    </div>
  );
}
