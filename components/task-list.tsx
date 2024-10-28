"use client";

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { useAuthContext } from '../contexts/AuthContext';

interface Task {
  id: number;
  taskName: string;
  description: string | null;
  priority: string;
  project: { name: string } | null;
  deadline: string;
  timeRequired: number;
}

interface TaskListProps {
  refreshTrigger?: number;
}

const TaskList: React.FC<TaskListProps> = ({ refreshTrigger = 0 }) => {
  const { userId } = useAuthContext();
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    if (userId) {
      fetchTasks();
    }
  }, [userId, refreshTrigger]); // Add refreshTrigger to dependency array

  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/tasks');
      if (response.ok) {
        const data = await response.json();
        setTasks(data);
      } else {
        console.error('Failed to fetch tasks');
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  return (
    <div className="bg-white p-4 rounded-md shadow-sm">
      <h2 className="text-xl font-semibold mb-4">Tasks</h2>
      {tasks.length === 0 ? (
        <p>No tasks scheduled.</p>
      ) : (
        <ul>
          {tasks.map((task) => (
            <li key={task.id} className="mb-2 p-2 border rounded">
              <div className="font-semibold">{task.taskName}</div>
              <div className="text-sm text-gray-600">
                Project: {task.project?.name || 'No Project'} | Priority: {task.priority}
              </div>
              <div className="text-sm">
                Deadline: {format(new Date(task.deadline), 'PPp')}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default TaskList;
