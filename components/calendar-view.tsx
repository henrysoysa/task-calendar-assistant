"use client";

import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { EventInput } from '@fullcalendar/core';
import AddEventButton from './add-event-button';
import TaskList from './task-list';
import { useAuth } from '../contexts/AuthContext';
import SignIn from './SignIn';

const CalendarView: React.FC = () => {
  const { user, loading } = useAuth();
  const [events, setEvents] = useState<EventInput[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (user) {
      fetchEvents();
    }
  }, [user, refreshKey]);

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/events');
      if (response.ok) {
        const data = await response.json();
        const calendarEvents = data.tasks.map((task: any) => ({
          id: `task-${task.id}`,
          title: task.taskName,
          start: task.deadline,
          end: new Date(new Date(task.deadline).getTime() + task.timeRequired * 60000),
          extendedProps: {
            type: 'task',
            description: task.description,
            priority: task.priority,
            project: task.project.name
          }
        }));
        setEvents(calendarEvents);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const handleEventAdded = () => {
    setRefreshKey(prevKey => prevKey + 1);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <SignIn />;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-4 flex justify-end">
        <AddEventButton onEventAdded={handleEventAdded} />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            events={events}
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay'
            }}
            height="auto"
          />
        </div>
        <div>
          <TaskList refreshKey={refreshKey} />
        </div>
      </div>
    </div>
  );
};

export default CalendarView;
