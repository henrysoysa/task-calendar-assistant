"use client";

import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { EventInput } from '@fullcalendar/core';
import AddEventButton from './add-event-button';
import TaskList from './task-list';

const CalendarView: React.FC = () => {
  const [events, setEvents] = useState<EventInput[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    fetchEvents();
  }, [refreshKey]);

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/events');
      if (response.ok) {
        const data = await response.json();
        setEvents(data.map((event: any) => ({
          id: event.id,
          title: event.taskName,
          start: event.deadline,
          end: new Date(new Date(event.deadline).getTime() + event.timeRequired * 60000),
          extendedProps: {
            description: event.description,
            priority: event.priority,
            project: event.project.name
          }
        })));
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const handleEventAdded = () => {
    setRefreshKey(prevKey => prevKey + 1);
  };

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
