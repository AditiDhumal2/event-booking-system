'use client';

interface DeleteButtonProps {
  eventId: string;
  deleteAction: (eventId: string) => Promise<void>;
}

export default function DeleteButton({ eventId, deleteAction }: DeleteButtonProps) {
  const handleClick = async () => {
    if (!confirm('Are you sure you want to delete this event?')) {
      return;
    }
    
    try {
      await deleteAction(eventId);
      // Refresh the page after successful deletion
      window.location.reload();
    } catch (error) {
      console.error('Failed to delete event:', error);
      alert('Failed to delete event');
    }
  };

  return (
    <button 
      onClick={handleClick}
      className="text-red-600 hover:text-red-900"
    >
      Delete
    </button>
  );
}