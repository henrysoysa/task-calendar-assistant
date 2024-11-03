export interface Task {
  id: number;
  taskName: string;
  description?: string;
  priority: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';
  deadline: Date;
  timeRequired: number;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED';
  projectId?: number;
  userId: string;
  scheduledStart?: Date;
  scheduledEnd?: Date;
}

export interface TimeSlot {
  start: Date;
  end: Date;
}

export interface Event {
  start: Date;
  end: Date;
  allDay?: boolean;
  title?: string;
} 