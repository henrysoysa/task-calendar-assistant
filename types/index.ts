export interface TimeSlot {
  start: Date;
  end: Date;
}

export interface Task {
  id: number;
  taskName: string;
  deadline: Date;
  timeRequired: number; // in minutes
  priority: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';
  description?: string | null;
  projectId?: number | null;
  status?: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED';
}

export interface Event {
  start: Date;
  end: Date;
} 