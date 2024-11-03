import { TimeSlot, Task, Event } from '../types/index';
import { startOfDay, endOfDay, addDays, isAfter, isBefore, addMinutes } from 'date-fns';

const PRIORITY_WEIGHTS = {
  'URGENT': 4,
  'HIGH': 3,
  'MEDIUM': 2,
  'LOW': 1
} as const;

// Find all available time slots in a given date range
const findAvailableSlots = (
  startDate: Date,
  endDate: Date,
  existingEvents: Event[],
  minimumDuration: number = 30 // minimum slot size in minutes
): TimeSlot[] => {
  const slots: TimeSlot[] = [];
  let currentDate = startOfDay(startDate);
  const lastDate = endOfDay(endDate);

  // If no events, return the entire time range as one slot
  if (!existingEvents.length) {
    return [{
      start: currentDate,
      end: lastDate
    }];
  }

  // Sort events chronologically
  const sortedEvents = [...existingEvents].sort((a, b) => 
    a.start.getTime() - b.start.getTime()
  );

  // Check for slot before first event
  if (sortedEvents[0].start > currentDate) {
    slots.push({
      start: currentDate,
      end: sortedEvents[0].start
    });
  }

  // Find gaps between events
  for (let i = 0; i < sortedEvents.length - 1; i++) {
    const gapStart = sortedEvents[i].end;
    const gapEnd = sortedEvents[i + 1].start;
    const duration = (gapEnd.getTime() - gapStart.getTime()) / (1000 * 60); // duration in minutes

    if (duration >= minimumDuration) {
      slots.push({
        start: gapStart,
        end: gapEnd
      });
    }
  }

  // Check for slot after last event
  const lastEvent = sortedEvents[sortedEvents.length - 1];
  if (lastEvent.end < lastDate) {
    slots.push({
      start: lastEvent.end,
      end: lastDate
    });
  }

  return slots;
};

// Check if a slot can fit a task
const canFitTask = (slot: TimeSlot, taskDuration: number): boolean => {
  const slotDuration = (slot.end.getTime() - slot.start.getTime()) / (1000 * 60);
  return slotDuration >= taskDuration;
};

// Find the best slot for a task based on priority and deadline
const findBestSlot = (
  task: Task,
  availableSlots: TimeSlot[],
  existingEvents: Event[]
): TimeSlot | null => {
  const validSlots = availableSlots.filter(slot => 
    canFitTask(slot, task.timeRequired) && 
    isBefore(addMinutes(slot.start, task.timeRequired), task.deadline)
  );

  if (!validSlots.length) return null;

  // For urgent/high priority tasks, use earliest available slot
  if (PRIORITY_WEIGHTS[task.priority] >= PRIORITY_WEIGHTS.HIGH) {
    return validSlots[0];
  }

  // For medium priority, try to find a slot closer to the middle of the available time
  if (task.priority === 'MEDIUM') {
    const middleIndex = Math.floor(validSlots.length / 2);
    return validSlots[middleIndex];
  }

  // For low priority tasks, use later slots
  return validSlots[validSlots.length - 1];
};

// Schedule a single task
const scheduleTask = (task: Task, existingEvents: Event[]): TimeSlot => {
  const lookAheadDays = 7; // Look ahead window for scheduling
  const availableSlots = findAvailableSlots(
    new Date(),
    addDays(task.deadline, lookAheadDays),
    existingEvents
  );

  const bestSlot = findBestSlot(task, availableSlots, existingEvents);
  
  if (!bestSlot) {
    // Fallback to deadline-based scheduling if no suitable slot found
    const latestStart = new Date(task.deadline.getTime() - task.timeRequired * 60000);
    return {
      start: latestStart,
      end: task.deadline
    };
  }

  return {
    start: bestSlot.start,
    end: new Date(bestSlot.start.getTime() + task.timeRequired * 60000)
  };
};

// Schedule multiple tasks optimally
const scheduleMultipleTasks = (tasks: Task[], existingEvents: Event[]): Map<number, TimeSlot> => {
  const schedule = new Map<number, TimeSlot>();
  
  // Sort tasks by priority and deadline
  const sortedTasks = [...tasks].sort((a, b) => {
    const priorityDiff = PRIORITY_WEIGHTS[b.priority] - PRIORITY_WEIGHTS[a.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return a.deadline.getTime() - b.deadline.getTime();
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
  canFitTask,
  findBestSlot,
  scheduleTask,
  scheduleMultipleTasks,
  hasOverlap,
  needsRescheduling,
  PRIORITY_WEIGHTS
};