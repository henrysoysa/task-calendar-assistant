"use client";

import React, { useState, useEffect } from 'react';
import { Priority } from '@prisma/client';

interface AddEventFormProps {
  onSubmit: (event: { title: string, date: Date }) => void;
  onClose: () => void;
}

const AddEventForm: React.FC<AddEventFormProps> = ({ onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    taskName: '',
    description: '',
    priority: Priority.MEDIUM,
    project: '',
    deadline: '',
    timeRequired: '',
  });
  const [projects, setProjects] = useState<string[]>([]);
  const [isNewProject, setIsNewProject] = useState(false);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch('/api/projects');
        if (response.ok) {
          const data = await response.json();
          setProjects(data.map(p => p.name));
        }
      } catch (error) {
        console.error('Error fetching projects:', error);
      }
    };
    fetchProjects();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prevData => ({ ...prevData, [name]: value }));
  };

  const handleProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === 'new') {
      setIsNewProject(true);
      setFormData(prevData => ({ ...prevData, project: '' }));
    } else {
      setIsNewProject(false);
      setFormData(prevData => ({ ...prevData, project: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          userId: 'user1', // This should be replaced with actual user ID when authentication is implemented
          timeRequired: parseInt(formData.timeRequired, 10)
        }),
      });
      if (response.ok) {
        const newEvent = await response.json();
        onSubmit(newEvent);
        onClose();
      } else {
        const errorData = await response.json();
        console.error('Failed to add event:', errorData.error);
        // Show error message to the user
      }
    } catch (error) {
      console.error('Error adding event:', error);
      // Show error message to the user
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2 className="text-2xl font-bold mb-4">Add New Task</h2>
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="taskName">
          Task Name
        </label>
        <input
          type="text"
          id="taskName"
          name="taskName"
          value={formData.taskName}
          onChange={handleChange}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          required
        />
      </div>
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="description">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        />
      </div>
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="priority">
          Priority
        </label>
        <select
          id="priority"
          name="priority"
          value={formData.priority}
          onChange={handleChange}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        >
          {Object.values(Priority).map(priority => (
            <option key={priority} value={priority}>{priority}</option>
          ))}
        </select>
      </div>
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="project">
          Project
        </label>
        {projects.length > 0 ? (
          <select
            id="project"
            name="project"
            value={formData.project}
            onChange={handleProjectChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          >
            <option value="">Select a project</option>
            {projects.map(project => (
              <option key={project} value={project}>{project}</option>
            ))}
            <option value="new">Add new project</option>
          </select>
        ) : (
          <input
            type="text"
            id="project"
            name="project"
            value={formData.project}
            onChange={handleChange}
            placeholder="Enter project name"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          />
        )}
      </div>
      {isNewProject && (
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="newProject">
            New Project Name
          </label>
          <input
            type="text"
            id="project"
            name="project"
            value={formData.project}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          />
        </div>
      )}
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="deadline">
          Deadline
        </label>
        <input
          type="datetime-local"
          id="deadline"
          name="deadline"
          value={formData.deadline}
          onChange={handleChange}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          required
        />
      </div>
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="timeRequired">
          Time Required (minutes)
        </label>
        <input
          type="number"
          id="timeRequired"
          name="timeRequired"
          value={formData.timeRequired}
          onChange={handleChange}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          required
          min="1"
        />
      </div>
      <div className="flex items-center justify-between mt-6">
        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          Add Task
        </button>
        <button
          type="button"
          onClick={onClose}
          className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default AddEventForm;
