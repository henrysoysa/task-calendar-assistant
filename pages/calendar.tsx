import React from 'react';
import { useAuthContext } from '../contexts/AuthContext';

const CalendarView: React.FC = () => {
  const { userId, loading } = useAuthContext();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!userId) {
    return <div>Please sign in to view your calendar.</div>;
  }

  return (
    <div>
      <h1>Welcome to your Calendar</h1>
      {/* Your calendar component here */}
    </div>
  );
};

export default CalendarView;
