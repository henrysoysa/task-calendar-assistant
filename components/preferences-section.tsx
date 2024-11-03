import React from 'react';
import { WORKING_HOURS } from '@/lib/scheduling';

const PreferencesSection = () => {
  const workingDaysMap = {
    0: 'Sunday',
    1: 'Monday',
    2: 'Tuesday',
    3: 'Wednesday',
    4: 'Thursday',
    5: 'Friday',
    6: 'Saturday'
  };

  const formatTime = (hour: number) => {
    return `${hour.toString().padStart(2, '0')}:00`;
  };

  const workingDays = WORKING_HOURS.workingDays
    .map(day => workingDaysMap[day as keyof typeof workingDaysMap])
    .join(', ');

  return (
    <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Scheduling Preferences</h2>
      </div>

      <div className="space-y-4">
        <div className="border-b pb-4">
          <h3 className="text-lg font-semibold mb-2">Working Hours</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-600">Start Time</p>
              <p className="font-medium">{formatTime(WORKING_HOURS.start)}</p>
            </div>
            <div>
              <p className="text-gray-600">End Time</p>
              <p className="font-medium">{formatTime(WORKING_HOURS.end)}</p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">Working Days</h3>
          <p className="font-medium">{workingDays}</p>
        </div>

        <div className="pt-4 border-t">
          <p className="text-sm text-gray-600">
            These settings determine when tasks can be automatically scheduled.
            Tasks will only be scheduled during working hours on working days.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PreferencesSection; 