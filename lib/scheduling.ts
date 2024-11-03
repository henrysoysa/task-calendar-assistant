import { TimeSlot, Task, Event } from '../types/index';
import { 
  startOfDay, 
  endOfDay, 
  addDays, 
  isAfter, 
  isBefore, 
  addMinutes,
  setHours,
  setMinutes,
  isWeekend,
  getDay,
  isSameDay,
  areIntervalsOverlapping
} from 'date-fns';

// Working hours configuration
const WORKING_HOURS = {
  start: 9, // 9 AM
  end: 18,  // 6 PM
  workingDays: [1, 2, 3, 4, 5] // Monday to Friday
};

// Check if time is within working hours
const isWithinWorkingHours = (date: Date): boolean => {
  const hour = date.getHours();
  const day = getDay(date);
  return WORKING_HOURS.workingDays.includes(day) && 
         hour >= WORKING_HOURS.start && 
         hour < WORKING_HOURS.end;
};

// Get next working time
const getNextWorkingTime = (date: Date): Date => {
  let nextTime = new Date(date);

  while (isWeekend(nextTime)) {
    nextTime = addDays(nextTime, 1);
  }

  const hour = nextTime.getHours();
  if (hour < WORKING_HOURS.start) {
    nextTime = setHours(nextTime, WORKING_HOURS.start);
    nextTime = setMinutes(nextTime, 0);
  } else if (hour >= WORKING_HOURS.end) {
    nextTime = addDays(nextTime, 1);
    nextTime = setHours(nextTime, WORKING_HOURS.start);
    nextTime = setMinutes(nextTime, 0);
  }

  return nextTime;
};

// Check for overlapping time slots
const hasOverlap = (slot1: TimeSlot, slot2: TimeSlot): boolean => {
  return slot1.start < slot2.end && slot2.start < slot1.end;
};

// Check if rescheduling is needed
const needsRescheduling = (lastScheduled: Date): boolean => {
  const today = startOfDay(new Date());
  const lastScheduledDay = startOfDay(lastScheduled);
  return isAfter(today, lastScheduledDay);
};

// Add debug logging function with more visible formatting
const debug = (message: string, ...args: any[]) => {
  console.group('🗓️ Scheduling Debug');
  console.log(
    '%c' + message,
    'color: #8b5cf6; font-weight: bold;',
    ...args
  );
  console.groupEnd();
};

// Helper function to check if a slot overlaps with any existing events
const hasConflict = (slot: TimeSlot, existingEvents: Event[]): boolean => {
  console.log('Checking conflicts for:', {
    slot,
    against: existingEvents.length + ' events'
  });

  const conflicts = existingEvents.filter(event => {
    const eventStart = new Date(event.start);
    const eventEnd = new Date(event.end);
    const eventData = event as { allDay?: boolean; isGoogleEvent?: boolean };
    
    const overlaps = (
      (slot.start < eventEnd && slot.end > eventStart) ||
      (slot.start >= eventStart && slot.start < eventEnd) ||
      (slot.end > eventStart && slot.end <= eventEnd) ||
      (slot.start <= eventStart && slot.end >= eventEnd)
    );

    if (overlaps) {
      console.log('Found conflict with event:', {
        event: {
          start: eventStart.toISOString(),
          end: eventEnd.toISOString(),
          isGoogle: eventData.isGoogleEvent,
          isAllDay: eventData.allDay
        }
      });
    }

    return overlaps;
  });

  return conflicts.length > 0;
};

// Find available slots in a day
const findDailySlots = (
  date: Date,
  existingEvents: Event[],
  minimumDuration: number
): TimeSlot[] => {
  debug('Finding available slots', {
    date: date.toISOString(),
    minimumDuration,
    existingEvents: existingEvents.length
  });

  const slots: TimeSlot[] = [];
  const dayStart = setHours(startOfDay(date), WORKING_HOURS.start);
  const dayEnd = setHours(startOfDay(date), WORKING_HOURS.end);

  // Filter events for this day
  const dayEvents = existingEvents
    .filter(event => {
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);
      const eventData = event as { allDay?: boolean };
      
      // Include events that overlap with this day
      return (
        (isSameDay(eventStart, date) || isSameDay(eventEnd, date)) &&
        !eventData.allDay
      );
    })
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

  // If no events, return the whole working day
  if (dayEvents.length === 0) {
    slots.push({ start: dayStart, end: dayEnd });
    return slots;
  }

  let currentTime = dayStart;

  // Iterate through the day finding gaps
  for (let i = 0; i <= dayEvents.length; i++) {
    const slotEnd = i < dayEvents.length 
      ? new Date(dayEvents[i].start)
      : dayEnd;

    // Check if there's enough time for the minimum duration
    const duration = (slotEnd.getTime() - currentTime.getTime()) / (1000 * 60);
    
    if (duration >= minimumDuration) {
      // Verify this slot doesn't conflict with any events
      const potentialSlot = { start: currentTime, end: slotEnd };
      if (!hasConflict(potentialSlot, existingEvents)) {
        slots.push(potentialSlot);
      }
    }

    if (i < dayEvents.length) {
      currentTime = new Date(dayEvents[i].end);
    }
  }

  debug('Found slots:', slots.map(slot => ({
    start: slot.start.toISOString(),
    end: slot.end.toISOString()
  })));

  return slots;
};

// Schedule multiple tasks
const scheduleMultipleTasks = (tasks: Task[], existingEvents: Event[]): Map<number, TimeSlot> => {
  const schedule = new Map<number, TimeSlot>();
  
  // Sort tasks by priority and deadline
  const sortedTasks = [...tasks].sort((a, b) => {
    // First by priority
    const priorityOrder = { 'URGENT': 0, 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3 };
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    
    // Then by deadline
    return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
  });

  // Schedule each task
  for (const task of sortedTasks) {
    const scheduledEvents = [
      ...existingEvents,
      ...Array.from(schedule.values()).map(slot => ({
        start: slot.start,
        end: slot.end
      }))
    ];
    const slot = scheduleTask(task, scheduledEvents);
    schedule.set(task.id, slot);
  }

  return schedule;
};

// Schedule a task in the best available slot
const scheduleTask = (task: Task, existingEvents: Event[]): TimeSlot => {
  console.log('=== Scheduling Task ===');
  console.log('Task:', {
    name: task.taskName,
    priority: task.priority,
    deadline: task.deadline,
    duration: task.timeRequired
  });
  console.log('Existing Events:', existingEvents);

  const now = new Date();
  const deadline = new Date(task.deadline);
  let bestSlot: TimeSlot | null = null;
  let currentDate = getNextWorkingTime(now);

  console.log('Starting search from:', currentDate);

  while (isBefore(currentDate, deadline)) {
    if (WORKING_HOURS.workingDays.includes(getDay(currentDate))) {
      const dailySlots = findDailySlots(currentDate, existingEvents, task.timeRequired);
      console.log('Found daily slots:', dailySlots);
      
      for (const slot of dailySlots) {
        const taskSlot = {
          start: slot.start,
          end: addMinutes(slot.start, task.timeRequired)
        };

        if (!hasConflict(taskSlot, existingEvents) && 
            isBefore(taskSlot.end, deadline)) {
          console.log('Found valid slot:', taskSlot);
          
          if (task.priority === 'URGENT' || task.priority === 'HIGH') {
            console.log('Using immediate slot for high priority');
            return taskSlot;
          }
          
          if (!bestSlot) {
            console.log('Storing first valid slot');
            bestSlot = taskSlot;
          }
        }
      }
    }
    
    currentDate = addDays(currentDate, 1);
    currentDate = setHours(currentDate, WORKING_HOURS.start);
  }

  if (bestSlot) {
    console.log('Using best found slot:', bestSlot);
    return bestSlot;
  }

  console.log('No valid slots found, searching for next available');

  // If no valid slots found before deadline, try to find the next available slot
  currentDate = getNextWorkingTime(now);
  while (true) {
    const dailySlots = findDailySlots(currentDate, existingEvents, task.timeRequired);
    
    for (const slot of dailySlots) {
      const taskSlot = {
        start: slot.start,
        end: addMinutes(slot.start, task.timeRequired)
      };

      if (!hasConflict(taskSlot, existingEvents)) {
        console.log('Found fallback slot:', taskSlot);
        return taskSlot;
      }
    }

    currentDate = addDays(currentDate, 1);
    currentDate = setHours(currentDate, WORKING_HOURS.start);
  }
};

// Export all functions
export {
  scheduleTask,
  scheduleMultipleTasks,
  hasOverlap,
  needsRescheduling,
  findDailySlots,
  isWithinWorkingHours,
  getNextWorkingTime,
  WORKING_HOURS
};