import React, { useState, useEffect, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Event } from '@prisma/client';
import { WORKING_HOURS } from '../lib/scheduling';
import './calendar.css'; // We'll create this file for custom styles

interface CalendarProps {
  events: Event[];
  onEventClick?: (event: any) => void;
}

const Calendar: React.FC<CalendarProps> = ({ events, onEventClick }) => {
  const calendarRef = useRef<FullCalendar>(null);
  const [allEvents, setAllEvents] = useState<any[]>([]);

  useEffect(() => {
    const formattedEvents = events.map(event => ({
      id: event.id.toString(),
      title: event.title,
      start: new Date(event.start),
      end: new Date(event.end),
      extendedProps: {
        isGoogleEvent: true
      }
    }));

    setAllEvents(formattedEvents);
  }, [events]);

  return (
    <div className="calendar-container bg-white shadow-sm rounded-lg">
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay'
        }}
        events={allEvents}
        eventClick={onEventClick}
        height="auto"
        scrollTime={`${WORKING_HOURS.start.toString().padStart(2, '0')}:00:00`}
        slotMinTime="00:00:00"
        slotMaxTime="24:00:00"
        expandRows={true}
        stickyHeaderDates={true}
        allDaySlot={false}
        slotDuration="00:30:00"
        slotLabelInterval="01:00"
        dayHeaderFormat={{ weekday: 'short', day: 'numeric' }}
        views={{
          timeGridWeek: {
            dayHeaderFormat: { weekday: 'short', day: 'numeric' },
            slotLabelFormat: {
              hour: '2-digit',
              minute: '2-digit',
              hour12: false
            }
          },
          timeGridDay: {
            dayHeaderFormat: { weekday: 'long', day: 'numeric' },
            slotLabelFormat: {
              hour: '2-digit',
              minute: '2-digit',
              hour12: false
            }
          }
        }}
        eventClassNames={(arg) => {
          const classes = ['rounded-md', 'border-none', 'px-2', 'py-1'];
          if (arg.event.extendedProps.isGoogleEvent) {
            classes.push('bg-violet-100', 'text-violet-800');
          }
          return classes;
        }}
      />
    </div>
  );
};

export default Calendar;
