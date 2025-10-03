// components/BookEventButton.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface BookEventButtonProps {
  eventId: string;
  eventTitle: string;
  eventPrice: number;
  availableSeats: number;
}

export default function BookEventButton({ eventId, eventTitle, eventPrice, availableSeats }: BookEventButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleBookEvent = async () => {
    if (availableSeats === 0) {
      alert('This event is sold out!');
      return;
    }

    setIsLoading(true);
    try {
      // Redirect to payment page with event details
      router.push(`/payment?eventId=${eventId}&tickets=1&totalPrice=${eventPrice}`);
    } catch (error) {
      console.error('Error redirecting to payment:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleBookEvent}
      disabled={isLoading || availableSeats === 0}
      className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {isLoading ? (
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
          Processing...
        </div>
      ) : availableSeats === 0 ? (
        'Sold Out'
      ) : (
        `Book Now - ${eventTitle}`
      )}
    </button>
  );
}