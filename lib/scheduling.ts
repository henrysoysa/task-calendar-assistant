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
  getDay
} from 'date-fns';

// Working hours configuration
const WORKING_HOURS = {
  start: 8, // 8 AM
  end: 18,  // 6 PM
  workingDays: [1, 2, 3, 4, 5] // Monday to Friday (0 = Sunday, 1 = Monday, etc.)
};

// Check if a given time is within working hours
const isWithinWorkingHours = (date: Date): boolean => {
  const hour = date.getHours();
  const day = getDay(date);
  
  return (
    WORKING_HOURS.workingDays.includes(day) &&
    hour >= WORKING_HOURS.start &&
    hour < WORKING_HOURS.end
  );
};

// Get next working hour start time from a given date
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

// Find all available time slots in a given day
const findDailySlots = (
  date: Date,
  existingEvents: Event[],
  minimumDuration: number = 30
): TimeSlot[] => {
  const slots: TimeSlot[] = [];
  const dayStart = setHours(startOfDay(date), WORKING_HOURS.start);
  const dayEnd = setHours(startOfDay(date), WORKING_HOURS.end);

  // Filter events for this day
  const dayEvents = existingEvents.filter(event => 
    isBefore(event.start, dayEnd) && isAfter(event.end, dayStart)
  ).sort((a, b) => a.start.getTime() - b.start.getTime());

  let currentTime = dayStart;

  // Handle gaps between events
  for (let i = 0; i <= dayEvents.length; i++) {
    const slotEnd = i < dayEvents.length ? dayEvents[i].start : dayEnd;
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

// Find all available slots within working hours
const findAvailableSlots = (
  startDate: Date,
  endDate: Date,
  existingEvents: Event[],
  minimumDuration: number = 30
): TimeSlot[] => {
  const slots: TimeSlot[] = [];
  let currentDate = startOfDay(startDate);
  const lastDate = endOfDay(endDate);

  while (currentDate < lastDate) {
    if (WORKING_HOURS.workingDays.includes(getDay(currentDate))) {
      const dailySlots = findDailySlots(currentDate, existingEvents, minimumDuration);
      slots.push(...dailySlots);
    }
    currentDate = addDays(currentDate, 1);
  }

  return slots;
};

// Schedule a single task
const scheduleTask = (task: Task, existingEvents: Event[]): TimeSlot => {
  const now = new Date();
  const deadline = new Date(task.deadline);
  const lookAheadDays = 14; // Look ahead window for scheduling

  // Find all available slots up to the deadline
  const availableSlots = findAvailableSlots(
    now,
    addDays(deadline, lookAheadDays),
    existingEvents,
    task.timeRequired
  );

  // Filter slots that can fit the task and end before deadline
  const validSlots = availableSlots.filter(slot => {
    const slotDuration = (slot.end.getTime() - slot.start.getTime()) / (1000 * 60);
    const taskEnd = addMinutes(slot.start, task.timeRequired);
    return slotDuration >= task.timeRequired && isBefore(taskEnd, deadline);
  });

  if (validSlots.length === 0) {
    // Fallback: schedule at deadline during working hours
    const latestStart = new Date(deadline);
    latestStart.setHours(Math.max(WORKING_HOURS.start, deadline.getHours() - Math.ceil(task.timeRequired / 60)));
    latestStart.setMinutes(deadline.getMinutes());
    
    return {
      start: latestStart,
      end: deadline
    };
  }

  // Choose best slot based on priority and deadline
  const bestSlot = validSlots[0]; // Use earliest available slot
  
  return {
    start: bestSlot.start,
    end: addMinutes(bestSlot.start, task.timeRequired)
  };
};

// Schedule multiple tasks optimally
const scheduleMultipleTasks = (tasks: Task[], existingEvents: Event[]): Map<number, TimeSlot> => {
  const schedule = new Map<number, TimeSlot>();
  
  // Sort tasks by priority and deadline
  const sortedTasks = [...tasks].sort((a, b) => {
    // First by deadline
    const deadlineDiff = new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    if (deadlineDiff !== 0) return deadlineDiff;
    
    // Then by priority (higher priority first)
    const priorityOrder = { 'URGENT': 0, 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
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

const hasOverlap = (slot1: TimeSlot, slot2: TimeSlot): boolean => {
  return slot1.start < slot2.end && slot2.start < slot1.end;
};

const needsRescheduling = (lastScheduled: Date): boolean => {
  const today = startOfDay(new Date());
  const lastScheduledDay = startOfDay(lastScheduled);
  return isAfter(today, lastScheduledDay);
};

// Single export statement for all functions and constants
export {
  findAvailableSlots,
  scheduleTask,
  scheduleMultipleTasks,
  hasOverlap,
  needsRescheduling,
  isWithinWorkingHours,
  getNextWorkingTime,
  WORKING_HOURS
};