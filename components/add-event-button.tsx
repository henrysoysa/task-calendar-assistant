"use client";

import { useState } from 'react';
import AddEventForm from './add-event-form';

interface AddEventButtonProps {
  onEventAdded: () => void;
}

const AddEventButton: React.FC<AddEventButtonProps> = ({ onEventAdded }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);

  const handleAddEvent = (newEvent: any) => {
    console.log('New event added:', newEvent);
    onEventAdded(); // Refresh the task list
    setIsFormOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setIsFormOpen(true)}
        className="w-full bg-black text-white py-2 rounded-md mb-8 hover:bg-gray-800 transition-colors"
      >
        + Add Event
      </button>
      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <AddEventForm onClose={() => setIsFormOpen(false)} onAddEvent={handleAddEvent} />
        </div>
      )}
    </>
  );
};

export default AddEventButton;
