"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import SignIn from '../components/sign-in';
import SignOut from '../components/sign-out';
import CalendarView from '../components/calendar-view';
import MonthSelector from '../components/month-selector';
import AddEventButton from '../components/add-event-button';
import TaskList from '../components/task-list';

type ViewMode = 'month' | 'week' | 'day';

const Home: React.FC = () => {
  console.log('Home: Rendering');
  const { user, loading } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [refreshKey, setRefreshKey] = useState(0);
  const [forceLoaded, setForceLoaded] = useState(false);

  useEffect(() => {
    console.log('Home: Auth state changed', { user, loading });
    const timer = setTimeout(() => {
      setForceLoaded(true);
    }, 5000); // Force loading to false after 5 seconds
    return () => clearTimeout(timer);
  }, [user, loading]);

  const refreshTasks = () => {
    setRefreshKey(prevKey => prevKey + 1);
  };

  if (loading && !forceLoaded) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col min-h-screen p-8">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Calendar Overview</h1>
        {user ? <SignOut /> : <p>Not signed in</p>}
      </header>
      {user ? (
        <main className="flex-grow">
          <MonthSelector viewMode={viewMode} setViewMode={setViewMode} />
          <CalendarView viewMode={viewMode} />
          <AddEventButton onEventAdded={refreshTasks} />
          <TaskList refreshKey={refreshKey} />
        </main>
      ) : (
        <div className="flex justify-center items-center h-full">
          <SignIn />
        </div>
      )}
      <footer>
        <p>Debug: User {user ? 'is' : 'is not'} signed in. Loading: {loading.toString()}</p>
        <p>User email: {user?.email}</p>
        <p>Auth provider: {user?.providerId}</p>
        <p>Force loaded: {forceLoaded.toString()}</p>
      </footer>
    </div>
  );
};

export default Home;
