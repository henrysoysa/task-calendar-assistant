"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
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
      if (!response.ok) return [];
      
      const events = await response.json();
      console.log('Fetched Google Calendar events:', events);
      
      return events.map((event: any) => ({
        id: `google-${event.googleCalendarEventId}`,
        title: event.title,
        start: event.isAllDay ? event.startTime.split('T')[0] : new Date(event.startTime),
        end: event.isAllDay ? event.endTime.split('T')[0] : new Date(event.endTime),
        allDay: event.isAllDay,
        extendedProps: {
          isGoogleEvent: true,
          description: event.description
        },
        backgroundColor: 'rgb(66, 133, 244)',
        borderColor: 'rgb(66, 133, 244)',
        textColor: 'white',
        className: `google-calendar-event ${event.isAllDay ? 'all-day-event' : ''}`
      }));
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

  const loadAllEvents = useCallback(async () => {
    if (!user) return;
    
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
  }, [user]);

  useEffect(() => {
    if (user) {
      console.log('Starting initial load...');
      loadAllEvents();
    }
  }, [user, loadAllEvents]);

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
        scrollToCurrentTime();
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
      const now = new Date();
      const scrollTime = {
        hours: now.getHours(),
        minutes: now.getMinutes(),
        seconds: 0
      };

      setTimeout(() => {
        calendarApi.scrollToTime(scrollTime);
      }, 100);
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

  const handleDatesSet = () => {
    if (currentView === 'timeGridWeek' || currentView === 'timeGridDay') {
      scrollToCurrentTime();
    }
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
            ref={calendarRef}
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
            nowIndicator={true}
            now={new Date()}
            slotMinTime="00:00:00"
            slotMaxTime="24:00:00"
            views={{
              dayGridMonth: {
                dayMaxEventRows: 2,
                moreLinkText: count => `+${count} more`,
                moreLinkClick: 'day'
              },
              timeGridWeek: {
                nowIndicator: true,
                allDaySlot: true,
                dayHeaderFormat: { weekday: 'short', month: 'numeric', day: 'numeric' },
                slotDuration: '00:30:00',
                slotLabelInterval: '01:00',
              },
              timeGridDay: {
                nowIndicator: true,
                allDaySlot: true,
                dayHeaderFormat: { weekday: 'long', month: 'long', day: 'numeric' },
                slotDuration: '00:30:00',
                slotLabelInterval: '01:00',
              }
            }}
            datesSet={handleDatesSet}
            scrollTime={`${new Date().getHours()}:${new Date().getMinutes()}:00`}
          />
        )}
      </div>
      <TaskList 
        refreshTrigger={refreshKey} 
        onTaskUpdate={() => {
          setRefreshKey(prev => prev + 1);
        }}
        editingTask={selectedTask}
        isEditDialogOpen={isEditDialogOpen}
        setIsEditDialogOpen={setIsEditDialogOpen}
        setEditingTask={setSelectedTask}
      />

      <style jsx global>{`
        /* Calendar Layout */
        .calendar-wrapper {
          height: 700px;
          display: flex;
          flex-direction: column;
          background: rgb(249, 250, 251);
          border-radius: 0.5rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          padding: 1rem;
        }

        /* Time grid specific */
        .fc-timegrid-body {
          height: 600px !important;
          overflow-y: auto !important;
          background: rgb(249, 250, 251);
        }

        /* Ensure the time grid is scrollable */
        .fc .fc-timegrid-body .fc-scroller {
          height: 100% !important;
          overflow-y: auto !important;
          background: rgb(249, 250, 251);
        }

        /* Header styles */
        .fc-header-toolbar {
          padding: 0.5rem;
          margin-bottom: 0.5rem !important;
          background: rgb(249, 250, 251);
        }

        /* Calendar background */
        .fc {
          background: rgb(249, 250, 251);
        }

        .fc-view-harness {
          background: rgb(249, 250, 251);
        }

        .fc-timegrid-slot {
          background: rgb(249, 250, 251) !important;
        }

        .fc-timegrid-col.fc-day {
          background: rgb(249, 250, 251);
        }

        .fc-timegrid-slot-label {
          background: rgb(249, 250, 251) !important;
        }

        /* Now indicator */
        .fc .fc-timegrid-now-indicator-line {
          border-color: #ef4444;
          border-width: 2px;
        }

        .fc .fc-timegrid-now-indicator-arrow {
          border-color: #ef4444;
          border-width: 5px;
        }

        /* Scrollbar styling */
        .fc .fc-scroller::-webkit-scrollbar {
          width: 8px;
        }

        .fc .fc-scroller::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }

        .fc .fc-scroller::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 4px;
        }

        .fc .fc-scroller::-webkit-scrollbar-thumb:hover {
          background: #555;
        }

        /* Mobile adjustments */
        @media (max-width: 620px) {
          .calendar-wrapper {
            height: 600px;
          }
        }

        /* Grid lines */
        .fc-timegrid-slot {
          border-color: #e5e7eb !important;
        }

        .fc-timegrid-slot-lane {
          border-color: #e5e7eb !important;
        }

        .fc-scrollgrid {
          border-color: #e5e7eb !important;
        }

        .fc th, .fc td {
          border-color: #e5e7eb !important;
        }
      `}</style>
    </div>
  );
};

export default CalendarView;
