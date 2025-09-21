'use client';

import { deleteEvent } from '@/actions/eventActions';

interface DeleteButtonProps {
  eventId: string;
}

export default function DeleteButton({ eventId }: DeleteButtonProps) {
  const handleClick = async () => {
    if (!confirm('Are you sure you want to delete this event?')) return;

    try {
      await deleteEvent(eventId);
      alert('Event deleted successfully');
      window.location.reload(); // Refresh page after deletion
    } catch (error) {
      console.error('Failed to delete event:', error);
      alert('Failed to delete event');
    }
  };

  return (
    <button onClick={handleClick} className="text-red-600 hover:text-red-900">
      Delete
    </button>
  );
}
