"use client";

import { useEffect, useState } from 'react';

interface Project {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
}

interface Task {
  id: number;
  taskName: string;
  description: string | null;
  priority: string;
  project: Project;
  deadline: string;
  timeRequired: number;
}

interface TaskListProps {
  refreshKey: number;
}

const TaskList: React.FC<TaskListProps> = ({ refreshKey }) => {
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
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

    fetchTasks();
  }, [refreshKey]); // This will cause the effect to run when refreshKey changes

  return (
    <div className="bg-white p-4 rounded-md shadow-sm">
      <h2 className="text-xl font-semibold mb-4">Events - Month View</h2>
      {tasks.length === 0 ? (
        <p>No events scheduled.</p>
      ) : (
        <ul>
          {tasks.map((task) => (
            <li key={task.id} className="mb-2">
              <strong>{task.taskName}</strong> - {task.project.name} (Priority: {task.priority})
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default TaskList;
