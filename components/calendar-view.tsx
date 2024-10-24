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
import SignIn from './SignIn';

const CalendarView: React.FC = () => {
  const { userId, loading } = useAuthContext();

  console.log("CalendarView - userId:", userId, "loading:", loading);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!userId) {
    return <div>Please sign in to view your calendar.</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-4 flex justify-end">
        <AddEventButton />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay'
            }}
            height="auto"
          />
        </div>
        <div>
          <TaskList />
        </div>
      </div>
    </div>
  );
};

export default CalendarView;
