"use client";

import React, { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday } from 'date-fns/esm';

interface CalendarViewProps {
  viewMode: 'month' | 'week' | 'day';
}

const CalendarView: React.FC<CalendarViewProps> = ({ viewMode }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const goToPreviousMonth = () => {
    setCurrentDate(prevDate => new Date(prevDate.getFullYear(), prevDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(prevDate => new Date(prevDate.getFullYear(), prevDate.getMonth() + 1, 1));
  };

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <button onClick={goToPreviousMonth} className="p-2 rounded-full hover:bg-gray-200">&lt;</button>
        <h2 className="text-2xl font-bold">{format(currentDate, 'MMMM yyyy')}</h2>
        <button onClick={goToNextMonth} className="p-2 rounded-full hover:bg-gray-200">&gt;</button>
      </div>
      <div className="grid grid-cols-7 gap-2 mb-2">
        {weekdays.map((day) => (
          <div key={day} className="text-center font-semibold">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-2">
        {daysInMonth.map((day) => (
          <div
            key={day.toString()}
            className={`p-2 border rounded ${
              !isSameMonth(day, currentDate) ? 'bg-gray-100 text-gray-400' :
              isToday(day) ? 'bg-blue-100 font-bold' : 'bg-white'
            }`}
          >
            {format(day, 'd')}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CalendarView;
