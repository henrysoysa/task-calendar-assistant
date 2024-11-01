import { subMinutes, addMinutes } from 'date-fns';
import { Task, Event } from '../types/index';

// Helper function to check if two time slots overlap
const hasOverlap = (start1: Date, end1: Date, start2: Date, end2: Date): boolean => {
  return start1 < end2 && start2 < end1;
};

// Function to find the next available time slot
const findNextAvailableSlot = (
  startTime: Date,
  duration: number,
  existingEvents: Event[]
): Date => {
  // If no existing events, return the start time
  if (!existingEvents.length) {
    return startTime;
  }

  // Sort events by start time
  const sortedEvents = [...existingEvents].sort((a, b) => 
    a.start.getTime() - b.start.getTime()
  );

  // Check if the proposed slot works
  const proposedEnd = addMinutes(startTime, duration);
  let currentStart = startTime;

  for (const event of sortedEvents) {
    // If there's no overlap with this event, we can keep checking
    if (!hasOverlap(currentStart, proposedEnd, event.start, event.end)) {
      continue;
    }

    // If there's an overlap, try starting after this event
    currentStart = new Date(event.end);
    // Update the proposed end time based on the new start time
    proposedEnd.setTime(currentStart.getTime() + duration * 60000);
  }

  return currentStart;
};

const scheduleTask = (task: Task, existingEvents: Event[]) => {
  // Calculate the latest possible start time (deadline minus duration)
  const latestStartTime = subMinutes(task.deadline, task.timeRequired);
  
  // Start searching for available slot from the latest possible start time
  const scheduledStartTime = findNextAvailableSlot(latestStartTime, task.timeRequired, existingEvents);
  
  return {
    start: scheduledStartTime,
    end: addMinutes(scheduledStartTime, task.timeRequired)
  };
};

export { scheduleTask, findNextAvailableSlot, hasOverlap };