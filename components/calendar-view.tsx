"use client";

import React, { useState, useEffect, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { EventInput, EventClickArg } from '@fullcalendar/core';
import AddEventButton from './add-event-button';
import TaskList from './task-list';
import { useAuthContext } from '../contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Button } from './ui/button';
import { ChevronDown } from 'lucide-react';
import { startOfDay, isAfter } from 'date-fns';
import { scheduleTask, needsRescheduling } from '../lib/scheduling';
import { useUser } from '@clerk/nextjs';
import GoogleCalendarIntegration from './google-calendar-integration';

interface TaskWithPriority {
  priority: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';
}

const CalendarView: React.FC = () => {
  const { user } = useUser();
  const [events, setEvents] = useState<EventInput[]>([]);
  const [googleEvents, setGoogleEvents] = useState<EventInput[]>([]);
  const [tasks, setTasks] = useState<EventInput[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [currentView, setCurrentView] = useState('dayGridMonth');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 0
  );
  const calendarRef = useRef<FullCalendar | null>(null);
  const [lastScheduledDate, setLastScheduledDate] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const checkSchedule = () => {
      if (needsRescheduling(lastScheduledDate)) {
        fetchTasks();
        setLastScheduledDate(new Date());
      }
    };

    checkSchedule();
    
    const intervalId = setInterval(checkSchedule, 60 * 60 * 1000);
    
    const handleFocus = () => checkSchedule();
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
    };
  }, [lastScheduledDate]);

  useEffect(() => {
    const storedDate = localStorage.getItem('lastScheduledDate');
    if (storedDate) {
      setLastScheduledDate(new Date(storedDate));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('lastScheduledDate', lastScheduledDate.toISOString());
  }, [lastScheduledDate]);

  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/tasks');
      if (response.ok) {
        const tasksData = await response.json();
        console.log('Fetched Tasks:', tasksData);
        
        const taskEvents = tasksData
          .filter((task: any) => task.status !== 'COMPLETED')
          .map((task: any) => ({
            id: `task-${task.id}`,
            title: `${task.taskName} (${task.priority})`,
            start: new Date(task.scheduledStart || task.deadline),
            end: new Date(task.scheduledEnd || task.deadline),
            extendedProps: {
              ...task,
              isTask: true
            },
            backgroundColor: task.priority === 'URGENT' ? '#ef4444' : 
                           task.priority === 'HIGH' ? '#f97316' :
                           task.priority === 'MEDIUM' ? '#eab308' : '#22c55e',
            borderColor: 'transparent',
            textColor: 'white',
            className: `task-event priority-${task.priority.toLowerCase()}`
          }));

        console.log('Formatted Task Events:', taskEvents);
        setTasks(taskEvents);
        combineAndSetEvents(googleEvents, taskEvents);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const fetchGoogleEvents = async () => {
    try {
      const response = await fetch('/api/google-calendar/events');
      if (response.ok) {
        const events = await response.json();
        console.log('Fetched Google Calendar events:', events);

        if (Array.isArray(events)) {
          const formattedEvents = events.map(event => ({
            id: `google-${event.googleCalendarEventId}`,
            title: event.title,
            start: new Date(event.startTime),
            end: new Date(event.endTime),
            allDay: event.isAllDay,
            extendedProps: {
              ...event,
              isGoogleEvent: true
            },
            backgroundColor: 'rgb(66, 133, 244)',
            borderColor: 'rgb(66, 133, 244)',
            textColor: 'white',
            className: `google-calendar-event ${event.isAllDay ? 'all-day-event' : ''}`
          }));

          console.log('Formatted Google events:', formattedEvents);
          setGoogleEvents(formattedEvents);
          return formattedEvents;
        }
      }
      return [];
    } catch (error) {
      console.error('Error fetching Google Calendar events:', error);
      return [];
    }
  };

  const fetchAndScheduleTasks = async (calendarEvents: EventInput[]) => {
    try {
      const response = await fetch('/api/tasks');
      if (response.ok) {
        const tasksData = await response.json();
        console.log('Fetched Tasks:', tasksData);
        
        const existingEvents = calendarEvents.map(event => ({
          start: new Date(event.start as string),
          end: new Date(event.end as string),
          allDay: event.allDay,
          title: event.title as string
        }));

        const sortedTasks = tasksData
          .filter((task: any) => task.status !== 'COMPLETED')
          .sort((a: TaskWithPriority, b: TaskWithPriority) => {
            const priorityOrder = {
              'URGENT': 0,
              'HIGH': 1,
              'MEDIUM': 2,
              'LOW': 3
            } as const;
            return priorityOrder[a.priority] - priorityOrder[b.priority];
          });

        const taskEvents = [];
        for (const task of sortedTasks) {
          const scheduledSlot = scheduleTask(task, existingEvents);
          
          const taskEvent = {
            id: `task-${task.id}`,
            title: `${task.taskName} (${task.priority})`,
            start: scheduledSlot.start,
            end: scheduledSlot.end,
            extendedProps: {
              ...task,
              isTask: true,
              scheduledStart: scheduledSlot.start,
              scheduledEnd: scheduledSlot.end
            },
            backgroundColor: task.priority === 'URGENT' ? '#ef4444' : 
                           task.priority === 'HIGH' ? '#f97316' :
                           task.priority === 'MEDIUM' ? '#eab308' : '#22c55e',
            borderColor: 'transparent',
            textColor: 'white',
            className: `task-event priority-${task.priority.toLowerCase()}`
          };

          existingEvents.push({
            start: scheduledSlot.start,
            end: scheduledSlot.end,
            title: task.taskName,
            allDay: false
          });

          taskEvents.push(taskEvent);
          
          console.log('Scheduled task:', {
            taskName: task.taskName,
            priority: task.priority,
            start: scheduledSlot.start,
            end: scheduledSlot.end,
            duration: task.timeRequired
          });
        }

        console.log('Scheduled Task Events:', taskEvents);
        setTasks(taskEvents);
        return taskEvents;
      }
      return [];
    } catch (error) {
      console.error('Error fetching tasks:', error);
      return [];
    }
  };

  const combineAndSetEvents = (calendarEvents: EventInput[], taskEvents: EventInput[]) => {
    console.log('Combining events:', {
      googleEvents: calendarEvents.length,
      taskEvents: taskEvents.length
    });
    
    const combinedEvents = [...calendarEvents, ...taskEvents];
    console.log('Combined events:', combinedEvents);
    setEvents(combinedEvents);
  };

  const loadAllEvents = async () => {
    setIsLoading(true);
    try {
      const calendarEvents = await fetchGoogleEvents();
      const taskEvents = await fetchAndScheduleTasks(calendarEvents);
      combineAndSetEvents(calendarEvents, taskEvents);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      console.log('Starting initial load...');
      loadAllEvents();
    }
  }, [user, refreshKey]);

  const handleTaskUpdate = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleContainerClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (!target.closest('.fc-event')) {
      setSelectedEventId(null);
    }
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    clickInfo.jsEvent.stopPropagation();
    const taskId = clickInfo.event.id;
    
    setSelectedEventId(prevId => prevId === taskId ? null : taskId);
    
    if (clickInfo.jsEvent.detail === 2) {
      const task = clickInfo.event.extendedProps;
      setSelectedTask(task);
      setIsEditDialogOpen(true);
    }
  };

  const handleViewChange = (view: string) => {
    setCurrentView(view);
    if (calendarRef.current) {
      const api = calendarRef.current.getApi();
      api.changeView(view);
      setCurrentView(api.view.type);
      
      if (view === 'timeGridWeek' || view === 'timeGridDay') {
        setTimeout(scrollToCurrentTime, 100);
      }
    }
  };

  const renderViewSelector = () => {
    if (windowWidth <= 620) {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-[130px]">
              {currentView === 'dayGridMonth' ? 'Month' : 
               currentView === 'timeGridWeek' ? 'Week' : 
               currentView === 'timeGridDay' ? 'Day' : 'Month'}
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem 
              onClick={() => handleViewChange('dayGridMonth')}
              className={currentView === 'dayGridMonth' ? 'bg-violet-50' : ''}
            >
              Month
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => handleViewChange('timeGridWeek')}
              className={currentView === 'timeGridWeek' ? 'bg-violet-50' : ''}
            >
              Week
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => handleViewChange('timeGridDay')}
              className={currentView === 'timeGridDay' ? 'bg-violet-50' : ''}
            >
              Day
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }
    return null;
  };

  const scrollToCurrentTime = () => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      const currentView = calendarApi.view;

      if (currentView.type === 'timeGridWeek' || currentView.type === 'timeGridDay') {
        const now = new Date();
        const scrollTime = {
          hours: now.getHours(),
          minutes: Math.max(0, now.getMinutes() - 30),
          seconds: 0
        };
        
        calendarApi.scrollToTime(scrollTime);
      }
    }
  };

  useEffect(() => {
    if (currentView === 'timeGridWeek' || currentView === 'timeGridDay') {
      scrollToCurrentTime();
    }
  }, [currentView]);

  const renderEventContent = (eventInfo: any) => {
    const isGoogleEvent = eventInfo.event.extendedProps.isGoogleEvent;
    
    return (
      <div className={`event-content ${isGoogleEvent ? 'google-event' : 'task-event'}`}>
        <div className="event-title">
          {isGoogleEvent && <span className="google-icon">📅</span>}
          {eventInfo.event.title}
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-4" onClick={handleContainerClick}>
      <div className="mb-4 flex flex-col sm:flex-row sm:justify-between gap-2">
        <div className="flex gap-2">
          <AddEventButton onEventAdded={() => {
            fetchTasks();
            setRefreshKey(prev => prev + 1);
          }} />
          {windowWidth <= 620 && renderViewSelector()}
        </div>
      </div>
      <div className={windowWidth <= 620 ? 'mobile-calendar' : ''}>
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <span className="text-gray-500">Loading calendar...</span>
          </div>
        ) : (
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView={currentView}
            events={events}
            eventClick={handleEventClick}
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
            eventContent={renderEventContent}
            allDaySlot={true}
            allDayText="All Day"
            views={{
              dayGridMonth: {
                dayMaxEventRows: 2,
                moreLinkText: count => `+${count} more`,
                moreLinkClick: 'day'
              },
              timeGridWeek: {
                allDaySlot: true,
                dayHeaderFormat: { weekday: 'short', month: 'numeric', day: 'numeric' },
                slotDuration: '00:30:00',
                slotLabelInterval: '01:00',
              },
              timeGridDay: {
                allDaySlot: true,
                dayHeaderFormat: { weekday: 'long', month: 'long', day: 'numeric' },
                slotDuration: '00:30:00',
                slotLabelInterval: '01:00',
              }
            }}
          />
        )}
      </div>
      <TaskList 
        refreshTrigger={refreshKey} 
        onTaskUpdate={() => {
          fetchTasks();
          setRefreshKey(prev => prev + 1);
        }}
        editingTask={selectedTask}
        isEditDialogOpen={isEditDialogOpen}
        setIsEditDialogOpen={setIsEditDialogOpen}
        setEditingTask={setSelectedTask}
      />

      <style jsx global>{`
        /* Calendar Container */
        .fc {
          background-color: white;
          border-radius: 0.5rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          padding: 1rem;
        }

        /* Header Buttons */
        .fc .fc-button-primary {
          background-color: rgb(139, 92, 246) !important; /* violet-500 */
          border-color: rgb(124, 58, 237) !important; /* violet-600 */
          transition: all 0.2s;
        }

        .fc .fc-button-primary:hover {
          background-color: rgb(99, 102, 241) !important; /* indigo-500 */
          border-color: rgb(79, 70, 229) !important; /* indigo-600 */
        }

        .fc .fc-button-primary:disabled {
          background-color: rgb(196, 181, 253) !important; /* violet-300 */
          border-color: rgb(167, 139, 250) !important; /* violet-400 */
        }

        .fc .fc-button-active {
          background-color: rgb(14, 165, 233) !important; /* sky-500 */
          border-color: rgb(2, 132, 199) !important; /* sky-600 */
        }

        /* Today Button */
        .fc .fc-today-button {
          background-color: rgb(244, 114, 182) !important; /* fuchsia-400 */
          border-color: rgb(236, 72, 153) !important; /* fuchsia-500 */
        }

        /* Selected Event */
        .selected-event {
          border: 2px solid rgb(139, 92, 246) !important; /* violet-500 */
          background-color: rgba(139, 92, 246, 0.1) !important;
          box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.2) !important;
        }

        /* Calendar Events */
        .fc-event {
          border-radius: 0.25rem;
          transition: all 0.2s ease-in-out;
          border: 1px solid transparent;
        }

        .fc-event:hover {
          box-shadow: 0 2px 4px rgba(99, 102, 241, 0.2); /* indigo-500 */
          transform: translateY(-1px);
        }

        /* Today's Date Highlight */
        .fc .fc-day-today {
          background-color: rgba(14, 165, 233, 0.05) !important; /* sky-500 */
        }

        /* Event Priority Colors */
        .fc-event.priority-urgent {
          background-color: rgb(244, 63, 94) !important; /* rose-500 */
          border-color: rgb(225, 29, 72) !important; /* rose-600 */
        }

        .fc-event.priority-high {
          background-color: rgb(236, 72, 153) !important; /* fuchsia-500 */
          border-color: rgb(219, 39, 119) !important; /* fuchsia-600 */
        }

        .fc-event.priority-medium {
          background-color: rgb(99, 102, 241) !important; /* indigo-500 */
          border-color: rgb(79, 70, 229) !important; /* indigo-600 */
        }

        .fc-event.priority-low {
          background-color: rgb(14, 165, 233) !important; /* sky-500 */
          border-color: rgb(2, 132, 199) !important; /* sky-600 */
        }

        /* Calendar Grid */
        .fc th {
          padding: 0.75rem 0;
          font-weight: 600;
          color: rgb(109, 40, 217); /* violet-700 */
        }

        .fc td {
          border-color: rgb(237, 233, 254); /* violet-100 */
        }

        /* Time Grid */
        .fc .fc-timegrid-slot {
          height: 3rem;
          border-color: rgb(237, 233, 254); /* violet-100 */
        }

        /* Mobile Adjustments */
        @media (max-width: 620px) {
          .fc .fc-toolbar-title {
            font-size: 1.2rem;
            color: rgb(139, 92, 246); /* violet-500 */
          }
        }
      `}</style>
    </div>
  );
};

export default CalendarView;
