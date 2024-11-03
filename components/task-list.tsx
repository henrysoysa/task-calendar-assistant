"use client";

import { useEffect, useState } from 'react';
import { format, isValid } from 'date-fns';
import { useAuthContext } from '../contexts/AuthContext';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Edit2, CheckCircle, Circle, PlayCircle, XCircle } from 'lucide-react';

interface Task {
  id: number;
  taskName: string;
  description: string | null;
  priority: string;
  project: { name: string } | null;
  deadline: string;
  timeRequired: number;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED';
}

interface TaskListProps {
  refreshTrigger?: number;
  onTaskUpdate: () => void;
  editingTask: Task | null;
  isEditDialogOpen: boolean;
  setIsEditDialogOpen: (isOpen: boolean) => void;
  setEditingTask: (task: Task | null) => void;
}

const TaskList: React.FC<TaskListProps> = ({ refreshTrigger = 0, onTaskUpdate, editingTask, isEditDialogOpen, setIsEditDialogOpen, setEditingTask }) => {
  const { userId } = useAuthContext();
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    if (userId) {
      fetchTasks();
    }
  }, [userId, refreshTrigger]);

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

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsEditDialogOpen(true);
  };

  const handleUpdateTask = async (updatedTask: Partial<Task>) => {
    if (!editingTask) return;

    try {
      const response = await fetch(`/api/tasks/${editingTask.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedTask),
      });

      if (response.ok) {
        fetchTasks();
        setIsEditDialogOpen(false);
        setEditingTask(null);
        onTaskUpdate();
      } else {
        console.error('Failed to update task');
      }
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleStatusChange = async (taskId: number, newStatus: Task['status']) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        fetchTasks();
        onTaskUpdate();
      } else {
        console.error('Failed to update task status');
      }
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="text-green-500" />;
      case 'IN_PROGRESS':
        return <PlayCircle className="text-violet-500" />;
      case 'BLOCKED':
        return <XCircle className="text-red-500" />;
      default:
        return <Circle className="text-violet-300" />;
    }
  };

  const formatDateForInput = (date: Date | string | null): string => {
    if (!date) return format(new Date(), "yyyy-MM-dd'T'HH:mm");
    
    const dateObj = date instanceof Date ? date : new Date(date);
    
    return isValid(dateObj) 
      ? format(dateObj, "yyyy-MM-dd'T'HH:mm")
      : format(new Date(), "yyyy-MM-dd'T'HH:mm");
  };

  return (
    <div className="bg-white p-4 rounded-md shadow-sm">
      <h2 className="text-xl font-semibold mb-4">Tasks</h2>
      {tasks.length === 0 ? (
        <p>No tasks scheduled.</p>
      ) : (
        <ul className="space-y-4">
          {tasks.map((task) => (
            <li key={task.id} className="p-4 border border-violet-100 rounded-lg hover:bg-violet-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getStatusIcon(task.status)}
                  <div>
                    <div className="font-semibold">{task.taskName}</div>
                    <div className="text-sm text-gray-600">
                      Project: {task.project?.name || 'No Project'} | Priority: {task.priority}
                    </div>
                    <div className="text-sm text-gray-500">
                      Deadline: {format(new Date(task.deadline), 'PPp')}
                    </div>
                    {task.description && (
                      <div className="text-sm text-gray-600 mt-1">{task.description}</div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditTask(task)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <select
                    value={task.status}
                    onChange={(e) => handleStatusChange(task.id, e.target.value as Task['status'])}
                    className="text-sm border rounded p-1"
                  >
                    <option value="NOT_STARTED">Not Started</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="BLOCKED">Blocked</option>
                  </select>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          {editingTask && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleUpdateTask({
                  taskName: formData.get('taskName') as string,
                  description: formData.get('description') as string,
                  priority: formData.get('priority') as string,
                  deadline: new Date(formData.get('deadline') as string).toISOString(),
                  timeRequired: parseInt(formData.get('timeRequired') as string, 10),
                });
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium mb-1">Task Name</label>
                <input
                  name="taskName"
                  defaultValue={editingTask.taskName}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  name="description"
                  defaultValue={editingTask.description || ''}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Priority</label>
                <select
                  name="priority"
                  defaultValue={editingTask.priority}
                  className="w-full p-2 border rounded"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Duration (minutes)</label>
                <input
                  type="number"
                  name="timeRequired"
                  defaultValue={editingTask.timeRequired}
                  min="1"
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Deadline</label>
                <input
                  type="datetime-local"
                  name="deadline"
                  defaultValue={formatDateForInput(editingTask.deadline)}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-violet-600 hover:bg-violet-700 text-white">
                  Save Changes
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TaskList;
