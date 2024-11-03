export interface Task {
  id: number;
  taskName: string;
  description?: string;
  priority: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';
  deadline: string | Date;
  timeRequired: number;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED';
  projectId?: number;
  userId: string;
}

export interface TimeSlot {
  start: Date;
  end: Date;
}

export interface Event {
  start: Date | string;
  end: Date | string;
  allDay?: boolean;
  isGoogleEvent?: boolean;
} 