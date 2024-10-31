"use client";

import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { EventInput } from '@fullcalendar/core';
import AddEventButton from './add-event-button';
import TaskList from './task-list';
import { useAuthContext } from '../contexts/AuthContext';

const CalendarView: React.FC = () => {
  const { userId, loading } = useAuthContext();
  const [events, setEvents] = useState<EventInput[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (userId) {
      fetchTasks();
    }
  }, [userId]);

  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/tasks');
      if (response.ok) {
        const tasks = await response.json();
        const calendarEvents = tasks.map((task: any) => ({
          id: task.id,
          title: task.taskName,
          start: task.deadline,
          end: new Date(new Date(task.deadline).getTime() + task.timeRequired * 60000),
          extendedProps: {
            description: task.description,
            priority: task.priority,
            projectId: task.projectId,
          },
        }));
        setEvents(calendarEvents);
      } else {
        console.error('Failed to fetch tasks');
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-4 flex justify-end">
        <AddEventButton onEventAdded={fetchTasks} />
      </div>
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        events={events}
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay',
        }}
        height="auto"
      />
      <TaskList refreshTrigger={refreshKey} />
    </div>
  );
};

export default CalendarView;
