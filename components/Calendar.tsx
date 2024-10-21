import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Event {
  id: number;
  title: string;
  start: string;
  end: string;
}

const Calendar: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await axios.get('/api/events');
      setEvents(response.data);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const addEvent = async (newEvent: Omit<Event, 'id'>) => {
    try {
      const response = await axios.post('/api/events', newEvent);
      setEvents([...events, response.data]);
    } catch (error) {
      console.error('Error adding event:', error);
    }
  };

  return (
    <div>
      <h2>Calendar</h2>
      <ul>
        {events.map((event) => (
          <li key={event.id}>
            {event.title} - {new Date(event.start).toLocaleString()} to {new Date(event.end).toLocaleString()}
          </li>
        ))}
      </ul>
      {/* Add a form here to create new events */}
    </div>
  );
};

export default Calendar;
