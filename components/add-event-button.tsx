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

  const handleClose = () => {
    setIsFormOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setIsFormOpen(true)}
        className="bg-black text-white py-2 px-4 rounded-md hover:bg-gray-800 transition-colors"
      >
        + Add Event
      </button>
      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <AddEventForm onClose={handleClose} onSubmit={handleAddEvent} />
          </div>
        </div>
      )}
    </>
  );
};

export default AddEventButton;
