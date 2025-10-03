// app/events/[id]/book/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getEventById } from '@/actions/eventActions';
import { formatCurrency } from '@/lib/utils';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function BookEventPage({ params }: PageProps) {
  const [tickets, setTickets] = useState(1);
  const [event, setEvent] = useState<any>(null);
  const [eventId, setEventId] = useState<string>('');
  const [error, setError] = useState('');
  const router = useRouter();

  // Load event data using useEffect
  useEffect(() => {
    async function loadEvent() {
      try {
        const resolvedParams = await params;
        setEventId(resolvedParams.id);
        
        const eventData = await getEventById(resolvedParams.id);
        if (eventData.success) {
          setEvent(eventData.event);
        } else {
          setError('Event not found');
        }
      } catch (err) {
        setError('Failed to load event');
      }
    }
    
    loadEvent();
  }, [params]);

  const handleProceedToPayment = () => {
    if (!event) return;
    
    const totalPrice = tickets * event.price;
    
    // Redirect to payment page with all necessary parameters
    router.push(`/payment?eventId=${eventId}&tickets=${tickets}&totalPrice=${totalPrice}`);
  };

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading event...</p>
        </div>
      </div>
    );
  }

  const totalPrice = tickets * event.price;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Book Your Tickets</h1>
          <p className="text-gray-600 mt-2">Secure your spot at this amazing event</p>
        </div>

        {/* Event Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-start space-x-4">
            <div className="w-20 h-20 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">🎪</span>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-800">{event.title}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3 text-sm text-gray-600">
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {new Date(event.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {event.location}
                </div>
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {new Date(event.date).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 8h6m-5 0a3 3 0 110 6H9l3 3m-3-6h6m6 1a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {formatCurrency(event.price)} per ticket
                </div>
              </div>
            </div>
          </div>

          {/* Available Seats */}
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-blue-800">Available Seats</span>
              <span className="text-lg font-bold text-blue-800">{event.availableSeats}</span>
            </div>
          </div>
        </div>

        {/* Booking Form */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          {/* Tickets Selection */}
          <div className="mb-6">
            <label htmlFor="tickets" className="block text-sm font-medium text-gray-700 mb-3">
              Number of Tickets
            </label>
            <div className="flex items-center space-x-4">
              <button
                type="button"
                onClick={() => setTickets(Math.max(1, tickets - 1))}
                disabled={tickets <= 1}
                className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                -
              </button>
              <input
                type="number"
                id="tickets"
                name="tickets"
                min="1"
                max={event.availableSeats}
                value={tickets}
                onChange={(e) => setTickets(parseInt(e.target.value) || 1)}
                className="w-20 text-center border border-gray-300 rounded-lg py-2 px-3 text-lg font-semibold"
              />
              <button
                type="button"
                onClick={() => setTickets(Math.min(event.availableSeats, tickets + 1))}
                disabled={tickets >= event.availableSeats}
                className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                +
              </button>
              <span className="text-sm text-gray-500 ml-2">
                Max: {event.availableSeats} tickets
              </span>
            </div>
          </div>

          {/* Price Summary */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600">Price per ticket</span>
              <span className="font-medium">{formatCurrency(event.price)}</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600">Quantity</span>
              <span className="font-medium">{tickets}</span>
            </div>
            <div className="border-t border-gray-200 pt-2 mt-2">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-800">Total Amount</span>
                <span className="text-2xl font-bold text-blue-600">
                  {formatCurrency(totalPrice)}
                </span>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-red-800">{error}</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 bg-gray-500 text-white py-3 px-6 rounded-lg hover:bg-gray-600 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleProceedToPayment}
              disabled={event.availableSeats === 0}
              className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              Proceed to Payment
            </button>
          </div>

          {/* Warning for no seats */}
          {event.availableSeats === 0 && (
            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span className="text-yellow-800">This event is fully booked</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}