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
import { 
  scheduleTask, 
  scheduleMultipleTasks, 
  hasOverlap, 
  needsRescheduling 
} from '../lib/scheduling';

const CalendarView: React.FC = () => {
  const { userId, loading } = useAuthContext();
  const [events, setEvents] = useState<EventInput[]>([]);
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
  }, [userId, refreshKey]);

  useEffect(() => {
    if (calendarRef.current) {
      const api = calendarRef.current.getApi();
      setCurrentView(api.view.type);
    }
  }, [windowWidth]);

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
        const tasks = await response.json();
        const now = new Date();
        
        // Add type for task priority
        type TaskPriority = 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';
        
        // Filter out completed tasks and convert remaining tasks to calendar events
        const activeTasks = tasks.filter((task: any) => 
          task.status !== 'COMPLETED' && 
          new Date(task.deadline) > now
        );

        // Get existing non-task events
        const existingEvents = events.filter(event => 
          !event.extendedProps?.isTask
        );

        // Schedule all active tasks
        const taskSchedule = new Map();
        const sortedTasks = [...activeTasks].sort((a, b) => {
          // Sort by priority first with proper typing
          const priorityOrder: Record<TaskPriority, number> = {
            'URGENT': 0,
            'HIGH': 1,
            'MEDIUM': 2,
            'LOW': 3
          };
          
          const priorityDiff = priorityOrder[a.priority as TaskPriority] - priorityOrder[b.priority as TaskPriority];
          if (priorityDiff !== 0) return priorityDiff;
          
          // Then by deadline
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        });

        // Schedule each task
        for (const task of sortedTasks) {
          // Convert task to proper format for scheduling
          const taskForScheduling = {
            id: task.id,
            taskName: task.taskName,
            deadline: new Date(task.deadline),
            timeRequired: task.timeRequired,
            priority: task.priority as TaskPriority
          };

          const scheduledTime = scheduleTask(taskForScheduling, [
            ...existingEvents,
            ...Array.from(taskSchedule.values())
          ]);
          taskSchedule.set(task.id, scheduledTime);
        }
        
        // Convert tasks to calendar events with proper date handling
        const calendarEvents = sortedTasks.map((task: any) => {
          const scheduledTime = taskSchedule.get(task.id) || {
            start: new Date(new Date(task.deadline).getTime() - task.timeRequired * 60000),
            end: new Date(task.deadline)
          };
          
          return {
            id: task.id.toString(),
            title: `${task.taskName} (${task.priority})`,
            start: scheduledTime.start.toISOString(), // Ensure proper date format
            end: scheduledTime.end.toISOString(),     // Ensure proper date format
            extendedProps: {
              ...task,
              isTask: true
            },
            className: `priority-${task.priority.toLowerCase()} ${
              task.status === 'IN_PROGRESS' ? 'in-progress' : ''
            } ${task.status === 'BLOCKED' ? 'blocked' : ''} ${
              selectedEventId === task.id.toString() ? 'selected-event' : ''
            }`,
          };
        });
        
        // Debug logging
        console.log('Active Tasks:', activeTasks.length);
        console.log('Calendar Events:', calendarEvents.length);
        
        setEvents([...existingEvents, ...calendarEvents]);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

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
      
      // Scroll to current time when switching to week or day view
      if (view === 'timeGridWeek' || view === 'timeGridDay') {
        setTimeout(scrollToCurrentTime, 100); // Small delay to ensure view is rendered
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

  // Function to scroll to current time in timeGrid views
  const scrollToCurrentTime = () => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      const currentView = calendarApi.view;

      if (currentView.type === 'timeGridWeek' || currentView.type === 'timeGridDay') {
        const now = new Date();
        // Convert current time to duration format (HH:mm:ss)
        const scrollTime = {
          hours: now.getHours(),
          minutes: Math.max(0, now.getMinutes() - 30), // Subtract 30 minutes but don't go below 0
          seconds: 0
        };
        
        calendarApi.scrollToTime(scrollTime);
      }
    }
  };

  // Add effect to handle initial scroll on view mount
  useEffect(() => {
    if (currentView === 'timeGridWeek' || currentView === 'timeGridDay') {
      scrollToCurrentTime();
    }
  }, [currentView]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4" onClick={handleContainerClick}>
      <div className="mb-4 flex flex-col sm:flex-row sm:justify-end gap-2">
        <AddEventButton onEventAdded={handleTaskUpdate} />
        {windowWidth <= 620 && renderViewSelector()}
      </div>
      <div className={windowWidth <= 620 ? 'mobile-calendar' : ''}>
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
          dayMaxEvents={2}
          dayMaxEventRows={2}
          scrollTime="06:00:00"
          slotMinTime="06:00:00"
          slotMaxTime="22:00:00"
          nowIndicator={true}
          views={{
            dayGridMonth: {
              dayMaxEvents: 2,
              dayMaxEventRows: 2,
              moreLinkText: count => `+${count} more`,
              moreLinkClick: 'day'
            },
            timeGridWeek: {
              dayHeaderFormat: { weekday: 'short', month: 'numeric', day: 'numeric' },
              slotDuration: '00:30:00',
              slotLabelInterval: '01:00',
            },
            timeGridDay: {
              dayHeaderFormat: { weekday: 'long', month: 'long', day: 'numeric' },
              slotDuration: '00:30:00',
              slotLabelInterval: '01:00',
            }
          }}
        />
      </div>
      <TaskList 
        refreshTrigger={refreshKey} 
        onTaskUpdate={handleTaskUpdate}
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
