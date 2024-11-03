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

// Working hours configuration - Updated start time to 9 AM
const WORKING_HOURS = {
  start: 9, // Changed from 8 AM to 9 AM
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
  
  // First, check if we're before today's working hours
  if (nextTime.getHours() < WORKING_HOURS.start) {
    nextTime.setHours(WORKING_HOURS.start, 0, 0, 0);
    if (WORKING_HOURS.workingDays.includes(getDay(nextTime))) {
      return nextTime;
    }
  }

  // If we're after today's working hours or it's not a working day,
  // move to next working day
  while (!WORKING_HOURS.workingDays.includes(getDay(nextTime)) || 
         nextTime.getHours() >= WORKING_HOURS.end) {
    nextTime = addDays(nextTime, 1);
    nextTime.setHours(WORKING_HOURS.start, 0, 0, 0);
  }

  // If we're within working hours, keep current time
  if (nextTime.getHours() >= WORKING_HOURS.start && 
      nextTime.getHours() < WORKING_HOURS.end &&
      WORKING_HOURS.workingDays.includes(getDay(nextTime))) {
    return nextTime;
  }

  // Default to start of next working day
  nextTime.setHours(WORKING_HOURS.start, 0, 0, 0);
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

interface ExternalEvent extends Event {
  isExternal: boolean;
  source: 'google' | 'other';
  title: string;
  allDay?: boolean;
}

const PRIORITY_ORDER = {
  'URGENT': 0,
  'HIGH': 1,
  'MEDIUM': 2,
  'LOW': 3
};

// Schedule a single task
const scheduleTask = (task: Task, existingEvents: (Event | ExternalEvent)[]): TimeSlot => {
  console.group('📅 Scheduling Task:', task.taskName);
  
  // Log task details
  console.log('Task Details:', {
    name: task.taskName,
    priority: task.priority,
    duration: task.timeRequired,
    deadline: new Date(task.deadline).toISOString()
  });

  // Log current time and working hours
  const now = new Date();
  const deadline = new Date(task.deadline);
  let currentDate = getNextWorkingTime(now);

  console.log('Time Context:', {
    currentTime: now.toISOString(),
    workingHoursStart: WORKING_HOURS.start,
    workingHoursEnd: WORKING_HOURS.end,
    nextWorkingTime: currentDate.toISOString(),
    deadline: deadline.toISOString()
  });

  // Filter and log blocking events
  const blockingEvents = existingEvents
    .filter(event => {
      const eventData = event as ExternalEvent;
      return !eventData.allDay;
    })
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

  console.log('Blocking Events:', blockingEvents.map(event => ({
    title: (event as any).title || 'Untitled',
    start: new Date(event.start).toISOString(),
    end: new Date(event.end).toISOString(),
    isExternal: (event as ExternalEvent).isExternal
  })));

  // Find all available slots up to deadline
  const availableSlots: TimeSlot[] = [];
  
  while (isBefore(currentDate, deadline)) {
    if (WORKING_HOURS.workingDays.includes(getDay(currentDate))) {
      const dayStart = setHours(startOfDay(currentDate), WORKING_HOURS.start);
      const dayEnd = setHours(startOfDay(currentDate), WORKING_HOURS.end);
      
      console.log(`Checking day ${currentDate.toDateString()}:`, {
        dayStart: dayStart.toISOString(),
        dayEnd: dayEnd.toISOString(),
        isWorkingDay: true,
        workingHours: `${WORKING_HOURS.start}:00-${WORKING_HOURS.end}:00`
      });

      // Get events for current day
      const dayEvents = blockingEvents.filter(event => 
        isSameDay(new Date(event.start), currentDate)
      );

      console.log('Events for this day:', dayEvents.map(event => ({
        title: (event as any).title || 'Untitled',
        start: new Date(event.start).toISOString(),
        end: new Date(event.end).toISOString()
      })));

      if (dayEvents.length === 0) {
        // Whole day is free
        console.log('Whole day is free');
        availableSlots.push({
          start: dayStart,
          end: dayEnd
        });
      } else {
        // Check gaps between events
        let timePointer = dayStart;

        for (let i = 0; i <= dayEvents.length; i++) {
          const slotEnd = i < dayEvents.length 
            ? new Date(dayEvents[i].start)
            : dayEnd;

          const duration = (slotEnd.getTime() - timePointer.getTime()) / (1000 * 60);
          
          console.log('Checking gap:', {
            start: timePointer.toISOString(),
            end: slotEnd.toISOString(),
            duration: `${duration} minutes`,
            requiredDuration: `${task.timeRequired} minutes`,
            isSufficient: duration >= task.timeRequired
          });

          if (duration >= task.timeRequired) {
            availableSlots.push({
              start: timePointer,
              end: slotEnd
            });
          }

          if (i < dayEvents.length) {
            timePointer = new Date(dayEvents[i].end);
          }
        }
      }
    } else {
      console.log(`Skipping non-working day: ${currentDate.toDateString()}`);
    }
    
    currentDate = addDays(currentDate, 1);
    currentDate = setHours(currentDate, WORKING_HOURS.start);
  }

  console.log('Available slots found:', availableSlots.map(slot => ({
    start: slot.start.toISOString(),
    end: slot.end.toISOString(),
    duration: (slot.end.getTime() - slot.start.getTime()) / (1000 * 60)
  })));

  // Sort slots by start time
  availableSlots.sort((a, b) => a.start.getTime() - b.start.getTime());

  console.log('Available slots found:', availableSlots.length);

  // Find the earliest valid slot that doesn't conflict with higher priority tasks
  for (const slot of availableSlots) {
    const taskSlot = {
      start: slot.start,
      end: addMinutes(slot.start, task.timeRequired)
    };

    // Check for conflicts with existing events
    const conflicts = blockingEvents.filter(event => {
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);
      const eventPriority = (event as any).extendedProps?.priority;
      
      // Only consider conflicts with higher or equal priority tasks
      if (eventPriority && PRIORITY_ORDER[eventPriority] > PRIORITY_ORDER[task.priority]) {
        return false;
      }

      return (
        (taskSlot.start < eventEnd && taskSlot.end > eventStart) ||
        (taskSlot.start >= eventStart && taskSlot.start < eventEnd) ||
        (taskSlot.end > eventStart && taskSlot.end <= eventEnd)
      );
    });

    if (conflicts.length === 0 && isBefore(taskSlot.end, deadline)) {
      console.log('Found valid slot:', {
        start: taskSlot.start.toISOString(),
        end: taskSlot.end.toISOString()
      });
      console.groupEnd();
      return taskSlot;
    }
  }

  // If no valid slot found, throw error
  console.error('No valid slots found for task:', task.taskName);
  console.groupEnd();
  throw new Error(`No valid slots available for task: ${task.taskName}`);
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

// Update hasConflict to handle external events
const hasConflict = (slot: TimeSlot, existingEvents: (Event | ExternalEvent)[]): boolean => {
  return existingEvents.some(event => {
    // Skip all-day events for conflict checking
    if ((event as ExternalEvent).allDay) {
      return false;
    }

    const eventStart = new Date(event.start);
    const eventEnd = new Date(event.end);
    
    return (
      (slot.start < eventEnd && slot.end > eventStart) ||
      (slot.start >= eventStart && slot.start < eventEnd) ||
      (slot.end > eventStart && slot.end <= eventEnd) ||
      (slot.start <= eventStart && slot.end >= eventEnd)
    );
  });
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
  WORKING_HOURS,
  hasConflict
};