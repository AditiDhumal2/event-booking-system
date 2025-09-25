'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface BookEventButtonProps {
  eventId: string;
  eventTitle: string;
}

export default function BookEventButton({ eventId, eventTitle }: BookEventButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleBookEvent = async () => {
    setIsLoading(true);
    try {
      // Redirect to booking page with event ID
      router.push(`/events/${eventId}/book`);
    } catch (error) {
      console.error('Error booking event:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleBookEvent}
      disabled={isLoading}
      className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
    >
      {isLoading ? (
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
          Processing...
        </div>
      ) : (
        `Book Now - ${eventTitle}`
      )}
    </button>
  );
}