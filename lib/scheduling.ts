import { TimeSlot, Task, Event } from '../types/index';

export class SchedulingConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SchedulingConflictError';
  }
}

const PRIORITY_WEIGHTS = {
  'URGENT': 4,
  'HIGH': 3,
  'MEDIUM': 2,
  'LOW': 1
} as const;

export const schedulingUtils = {
  // Check if two time slots overlap
  hasOverlap(slot1: TimeSlot, slot2: TimeSlot): boolean {
    return slot1.start < slot2.end && slot2.start < slot1.end;
  },

  // Calculate the optimal start time for a task
  calculateOptimalStartTime(task: Task, existingEvents: Event[]): Date {
    // Calculate the latest possible start time (deadline minus task duration)
    const latestPossibleStart = new Date(task.deadline.getTime() - task.timeRequired * 60000);
    
    // If there are no existing events, use the latest possible start time
    if (!existingEvents.length) {
      return latestPossibleStart;
    }

    // Sort events by end time in descending order to find the latest free slot
    const sortedEvents = [...existingEvents].sort((a, b) => 
      b.end.getTime() - a.end.getTime()
    );

    // Try to find a free slot that ends before the deadline
    for (let i = 0; i < sortedEvents.length; i++) {
      const currentEvent = sortedEvents[i];
      const nextEvent = sortedEvents[i + 1];
      
      // Calculate potential end time (which should be before or at deadline)
      const potentialEnd = new Date(Math.min(
        task.deadline.getTime(),
        currentEvent.start.getTime()
      ));
      const potentialStart = new Date(potentialEnd.getTime() - task.timeRequired * 60000);

      // Check if this slot works (no overlap with next event and starts after previous event)
      if ((!nextEvent || potentialStart >= nextEvent.end) && 
          potentialEnd <= task.deadline) {
        return potentialStart;
      }
    }

    // If no suitable slot found between events, use latest possible start
    return latestPossibleStart;
  },

  // Sort tasks by priority criteria
  sortTasksByPriority(tasks: Task[]): Task[] {
    return [...tasks].sort((a, b) => {
      // First, compare by deadline
      const deadlineDiff = a.deadline.getTime() - b.deadline.getTime();
      if (deadlineDiff !== 0) return deadlineDiff;

      // If deadlines are equal, compare by priority weight
      const priorityDiff = PRIORITY_WEIGHTS[b.priority] - PRIORITY_WEIGHTS[a.priority];
      if (priorityDiff !== 0) return priorityDiff;

      // If priorities are equal, compare by time required (shorter first)
      return a.timeRequired - b.timeRequired;
    });
  },

  // Check if a task can be scheduled without conflicts
  canScheduleTask(task: Task, existingEvents: Event[]): boolean {
    const scheduledTime = this.getScheduledTime(task, existingEvents);
    
    // Check if the task fits before its deadline
    if (scheduledTime.end > task.deadline) {
      return false;
    }

    // Check for conflicts with existing events
    return !existingEvents.some(event => 
      this.hasOverlap(scheduledTime, { start: event.start, end: event.end })
    );
  },

  // Find available time slots between events
  findAvailableSlots(events: Event[], taskDuration: number): TimeSlot[] {
    if (!events.length) return [];

    // Sort events by start time
    const sortedEvents = [...events].sort((a, b) => 
      a.start.getTime() - b.start.getTime()
    );

    const availableSlots: TimeSlot[] = [];
    
    // Check for slots between events
    for (let i = 0; i < sortedEvents.length - 1; i++) {
      const currentEnd = sortedEvents[i].end;
      const nextStart = sortedEvents[i + 1].start;
      const gap = (nextStart.getTime() - currentEnd.getTime()) / (1000 * 60); // gap in minutes

      if (gap >= taskDuration) {
        availableSlots.push({
          start: currentEnd,
          end: nextStart
        });
      }
    }

    return availableSlots;
  },

  // Get the scheduled time for a task
  getScheduledTime(task: Task, existingEvents: Event[]): TimeSlot {
    const startTime = this.calculateOptimalStartTime(task, existingEvents);
    return {
      start: startTime,
      end: new Date(Math.min(
        startTime.getTime() + task.timeRequired * 60000,
        task.deadline.getTime()
      ))
    };
  },

  // Suggest alternative time slots for a task
  suggestAlternativeSlots(task: Task, existingEvents: Event[], maxSuggestions: number = 3): TimeSlot[] {
    const availableSlots = this.findAvailableSlots(existingEvents, task.timeRequired);
    
    // Filter slots that end before the deadline
    const validSlots = availableSlots.filter(slot => 
      new Date(slot.start.getTime() + task.timeRequired * 60000) <= task.deadline
    );
    
    // Sort slots by how close they are to the optimal time (deadline - duration)
    return validSlots
      .sort((a, b) => {
        const optimalTime = new Date(task.deadline.getTime() - task.timeRequired * 60000);
        const aDistance = Math.abs(a.start.getTime() - optimalTime.getTime());
        const bDistance = Math.abs(b.start.getTime() - optimalTime.getTime());
        return aDistance - bDistance;
      })
      .slice(0, maxSuggestions);
  }
}; 