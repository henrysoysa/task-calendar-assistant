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
  isSameDay
} from 'date-fns';

// Working hours configuration
const WORKING_HOURS = {
  start: 9, // 9 AM
  end: 18,  // 6 PM
  workingDays: [1, 2, 3, 4, 5] // Monday to Friday
};

// Check if a time is within working hours
const isWithinWorkingHours = (date: Date): boolean => {
  const hour = date.getHours();
  const day = getDay(date);
  return WORKING_HOURS.workingDays.includes(day) && 
         hour >= WORKING_HOURS.start && 
         hour < WORKING_HOURS.end;
};

// Get next available working time
const getNextWorkingTime = (date: Date): Date => {
  let nextTime = new Date(date);

  // If it's weekend, move to Monday
  while (isWeekend(nextTime)) {
    nextTime = addDays(nextTime, 1);
  }

  // Set to start of working hours if outside working hours
  const hour = nextTime.getHours();
  if (hour < WORKING_HOURS.start) {
    nextTime = setHours(nextTime, WORKING_HOURS.start);
    nextTime = setMinutes(nextTime, 0);
  } else if (hour >= WORKING_HOURS.end) {
    // Move to next working day
    nextTime = addDays(nextTime, 1);
    nextTime = setHours(nextTime, WORKING_HOURS.start);
    nextTime = setMinutes(nextTime, 0);
  }

  return nextTime;
};

// Find available slots in a day
const findDailySlots = (
  date: Date,
  existingEvents: Event[],
  minimumDuration: number
): TimeSlot[] => {
  const slots: TimeSlot[] = [];
  const dayStart = setHours(startOfDay(date), WORKING_HOURS.start);
  const dayEnd = setHours(startOfDay(date), WORKING_HOURS.end);

  // Filter events for this day
  const dayEvents = existingEvents
    .filter(event => isSameDay(new Date(event.start), date))
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

  let currentTime = dayStart;

  // Add slots between events
  for (let i = 0; i <= dayEvents.length; i++) {
    const slotEnd = i < dayEvents.length 
      ? new Date(dayEvents[i].start)
      : dayEnd;

    const duration = (slotEnd.getTime() - currentTime.getTime()) / (1000 * 60);

    if (duration >= minimumDuration) {
      slots.push({
        start: currentTime,
        end: slotEnd
      });
    }

    if (i < dayEvents.length) {
      currentTime = new Date(dayEvents[i].end);
    }
  }

  return slots;
};

// Schedule a task in the best available slot
const scheduleTask = (task: Task, existingEvents: Event[]): TimeSlot => {
  const now = new Date();
  const deadline = new Date(task.deadline);
  
  // Initialize variables for best slot
  let bestSlot: TimeSlot | null = null;
  let currentDate = getNextWorkingTime(now);

  // Look for slots until deadline
  while (isBefore(currentDate, deadline)) {
    if (WORKING_HOURS.workingDays.includes(getDay(currentDate))) {
      const dailySlots = findDailySlots(currentDate, existingEvents, task.timeRequired);
      
      // Find first slot that fits the task
      const validSlot = dailySlots.find(slot => {
        const duration = (slot.end.getTime() - slot.start.getTime()) / (1000 * 60);
        return duration >= task.timeRequired;
      });

      if (validSlot) {
        // If high priority, use first available slot
        if (task.priority === 'URGENT' || task.priority === 'HIGH') {
          return {
            start: validSlot.start,
            end: addMinutes(validSlot.start, task.timeRequired)
          };
        }
        
        // For lower priorities, keep looking for better slots
        if (!bestSlot) {
          bestSlot = validSlot;
        }
      }
    }
    
    currentDate = addDays(currentDate, 1);
    currentDate = setHours(currentDate, WORKING_HOURS.start);
  }

  // If we found a slot, use it
  if (bestSlot) {
    return {
      start: bestSlot.start,
      end: addMinutes(bestSlot.start, task.timeRequired)
    };
  }

  // Fallback: schedule at deadline minus duration
  const latestStart = new Date(deadline.getTime() - task.timeRequired * 60000);
  return {
    start: getNextWorkingTime(latestStart),
    end: deadline
  };
};

// Add the missing functions that were previously removed
const hasOverlap = (slot1: TimeSlot, slot2: TimeSlot): boolean => {
  return slot1.start < slot2.end && slot2.start < slot1.end;
};

const needsRescheduling = (lastScheduled: Date): boolean => {
  const today = startOfDay(new Date());
  const lastScheduledDay = startOfDay(lastScheduled);
  return isAfter(today, lastScheduledDay);
};

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
      ...Array.from(schedule.values())
    ];
    const slot = scheduleTask(task, scheduledEvents);
    schedule.set(task.id, slot);
  }

  return schedule;
};

// Single export statement for all functions and constants
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