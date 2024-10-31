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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Button } from './ui/button';
import { ChevronDown } from 'lucide-react';

const CalendarView: React.FC = () => {
  const { userId, loading } = useAuthContext();
  const [events, setEvents] = useState<EventInput[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [currentView, setCurrentView] = useState('dayGridMonth');
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 0
  );

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  const handleViewChange = (view: string) => {
    setCurrentView(view);
  };

  const renderViewSelector = () => {
    if (windowWidth <= 620) {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-[130px]">
              {currentView === 'dayGridMonth' ? 'Month' : 
               currentView === 'timeGridWeek' ? 'Week' : 'Day'}
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => handleViewChange('dayGridMonth')}>
              Month
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleViewChange('timeGridWeek')}>
              Week
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleViewChange('timeGridDay')}>
              Day
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }
    return null;
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-4 flex flex-col sm:flex-row sm:justify-end gap-2">
        <AddEventButton onEventAdded={fetchTasks} />
        {windowWidth <= 620 && renderViewSelector()}
      </div>
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        view={currentView}
        events={events}
        headerToolbar={windowWidth <= 620 ? {
          left: 'title',
          center: '',
          right: 'prev,next,today'
        } : {
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay'
        }}
        height="auto"
        className={windowWidth <= 620 ? 'mobile-calendar' : ''}
      />
      <TaskList refreshTrigger={refreshKey} />
    </div>
  );
};

export default CalendarView;
