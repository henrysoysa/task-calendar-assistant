"use client";

import React from 'react';

interface MonthSelectorProps {
  viewMode: 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay';
  setViewMode: (mode: 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay') => void;
}

const MonthSelector: React.FC<MonthSelectorProps> = ({ viewMode, setViewMode }) => {
  return (
    <select
      value={viewMode}
      onChange={(e) => setViewMode(e.target.value as 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay')}
      className="block appearance-none w-full bg-white border border-gray-300 hover:border-gray-400 px-4 py-2 pr-8 rounded shadow leading-tight focus:outline-none focus:shadow-outline"
    >
      <option value="dayGridMonth">Month</option>
      <option value="timeGridWeek">Week</option>
      <option value="timeGridDay">Day</option>
    </select>
  );
};

export default MonthSelector;
