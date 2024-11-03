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

const WORKING_HOURS = {
  start: 9,
  end: 18,
  workingDays: [1, 2, 3, 4, 5]
};

const PRIORITY_ORDER: { [key: string]: number } = {
  'URGENT': 0,
  'HIGH': 1,
  'MEDIUM': 2,
  'LOW': 3
};

const isWithinWorkingHours = (date: Date): boolean => {
  const hour = date.getHours();
  const day = getDay(date);
  return WORKING_HOURS.workingDays.includes(day) && 
         hour >= WORKING_HOURS.start && 
         hour < WORKING_HOURS.end;
};

const getNextWorkingTime = (date: Date): Date => {
  let nextTime = new Date(date);

  // If before working hours, set to start of working hours
  if (nextTime.getHours() < WORKING_HOURS.start) {
    nextTime.setHours(WORKING_HOURS.start, 0, 0, 0);
  }

  // If after working hours, move to next day
  if (nextTime.getHours() >= WORKING_HOURS.end) {
    nextTime = addDays(nextTime, 1);
    nextTime.setHours(WORKING_HOURS.start, 0, 0, 0);
  }

  // If weekend, move to Monday
  while (isWeekend(nextTime)) {
    nextTime = addDays(nextTime, 1);
  }

  return nextTime;
};

// Helper function to check if a slot is blocked by higher priority tasks
const isBlockedByHigherPriorityTask = (
  slot: TimeSlot,
  existingEvents: Event[],
  taskPriority: string
): boolean => {
  return existingEvents.some(event => {
    const eventStart = new Date(event.start);
    const eventEnd = new Date(event.end);
    const eventData = event as any;

    // Skip if not a task or if lower priority
    if (!eventData.extendedProps?.isTask || 
        !eventData.extendedProps?.priority ||
        !PRIORITY_ORDER[eventData.extendedProps.priority] ||
        !PRIORITY_ORDER[taskPriority] ||
        PRIORITY_ORDER[eventData.extendedProps.priority] > PRIORITY_ORDER[taskPriority]) {
      return false;
    }

    return (
      (slot.start < eventEnd && slot.end > eventStart) ||
      (slot.start >= eventStart && slot.start < eventEnd) ||
      (slot.end > eventStart && slot.end <= eventEnd)
    );
  });
};

const findDailySlots = (
  date: Date,
  existingEvents: Event[],
  minimumDuration: number
): TimeSlot[] => {
  const slots: TimeSlot[] = [];
  const dayStart = setHours(startOfDay(date), WORKING_HOURS.start);
  const dayEnd = setHours(startOfDay(date), WORKING_HOURS.end);

  // Filter and sort all events for this day
  const dayEvents = existingEvents
    .filter(event => {
      const eventStart = new Date(event.start);
      return isSameDay(eventStart, date) && !(event as any).allDay;
    })
    .sort((a, b) => {
      const aData = a as any;
      const bData = b as any;
      // Sort by priority first (if they are tasks)
      if (aData.extendedProps?.isTask && bData.extendedProps?.isTask) {
        return PRIORITY_ORDER[aData.extendedProps.priority] - PRIORITY_ORDER[bData.extendedProps.priority];
      }
      // Then by start time
      return new Date(a.start).getTime() - new Date(b.start).getTime();
    });

  // If no events, return the whole working day
  if (dayEvents.length === 0) {
    slots.push({ start: dayStart, end: dayEnd });
    return slots;
  }

  // Check for slot before first event
  let currentTime = dayStart;
  const firstEventStart = new Date(dayEvents[0].start);
  if (firstEventStart > currentTime) {
    const duration = (firstEventStart.getTime() - currentTime.getTime()) / (1000 * 60);
    if (duration >= minimumDuration) {
      slots.push({ start: currentTime, end: firstEventStart });
    }
  }

  // Check slots between events
  for (let i = 0; i < dayEvents.length - 1; i++) {
    const currentEnd = new Date(dayEvents[i].end);
    const nextStart = new Date(dayEvents[i + 1].start);
    const duration = (nextStart.getTime() - currentEnd.getTime()) / (1000 * 60);

    if (duration >= minimumDuration) {
      slots.push({ start: currentEnd, end: nextStart });
    }
  }

  // Check for slot after last event
  const lastEvent = dayEvents[dayEvents.length - 1];
  const lastEventEnd = new Date(lastEvent.end);
  if (lastEventEnd < dayEnd) {
    const duration = (dayEnd.getTime() - lastEventEnd.getTime()) / (1000 * 60);
    if (duration >= minimumDuration) {
      slots.push({ start: lastEventEnd, end: dayEnd });
    }
  }

  return slots;
};

const scheduleTask = (task: Task, existingEvents: Event[]): TimeSlot => {
  const now = new Date();
  const deadline = new Date(task.deadline);
  let bestSlot: TimeSlot | null = null;
  let currentDate = getNextWorkingTime(now);

  // Look for slots until deadline
  while (isBefore(currentDate, deadline)) {
    if (WORKING_HOURS.workingDays.includes(getDay(currentDate))) {
      const dailySlots = findDailySlots(currentDate, existingEvents, task.timeRequired);
      
      for (const slot of dailySlots) {
        const taskSlot = {
          start: slot.start,
          end: addMinutes(slot.start, task.timeRequired)
        };

        // Check if slot is valid and not blocked by higher priority tasks
        if (!isBlockedByHigherPriorityTask(taskSlot, existingEvents, task.priority) && 
            isBefore(taskSlot.end, deadline)) {
          
          // For urgent/high priority tasks, use first available slot
          if (task.priority === 'URGENT' || task.priority === 'HIGH') {
            return taskSlot;
          }
          
          // For other priorities, store first valid slot
          if (!bestSlot) {
            bestSlot = taskSlot;
          }
        }
      }
    }
    
    currentDate = addDays(currentDate, 1);
    currentDate = setHours(currentDate, WORKING_HOURS.start);
  }

  if (bestSlot) {
    return bestSlot;
  }

  // If no slots found before deadline, find next available slot
  currentDate = getNextWorkingTime(now);
  while (true) {
    const dailySlots = findDailySlots(currentDate, existingEvents, task.timeRequired);
    
    for (const slot of dailySlots) {
      const taskSlot = {
        start: slot.start,
        end: addMinutes(slot.start, task.timeRequired)
      };

      if (!isBlockedByHigherPriorityTask(taskSlot, existingEvents, task.priority)) {
        return taskSlot;
      }
    }

    currentDate = addDays(currentDate, 1);
    currentDate = setHours(currentDate, WORKING_HOURS.start);
  }
};

const needsRescheduling = (lastScheduled: Date): boolean => {
  const today = startOfDay(new Date());
  const lastScheduledDay = startOfDay(lastScheduled);
  return isAfter(today, lastScheduledDay);
};

export {
  scheduleTask,
  findDailySlots,
  isWithinWorkingHours,
  getNextWorkingTime,
  WORKING_HOURS,
  needsRescheduling
};