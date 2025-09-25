'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { getEventById } from '@/actions/eventActions'; // make sure this exists
import Link from 'next/link';

interface EventType {
  _id: string;
  title: string;
  description: string;
  location: string;
  date: string;
  price?: number;
  totalSeats?: number;
  bookedSeats?: number;
  image?: string;
}

export default function EventDetail() {
  const searchParams = useSearchParams();
  const eventId = searchParams.get('id');

  const [event, setEvent] = useState<EventType | null>(null);

  useEffect(() => {
    async function fetchEvent() {
      if (!eventId) return;
      const result = await getEventById(eventId);
      if (result.success && result.event) {
        setEvent(result.event); // safe
      } else {
        setEvent(null);
      }
    }
    fetchEvent();
  }, [eventId]);

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600 text-lg">Loading event details...</p>
      </div>
    );
  }

  const eventDate = new Date(event.date).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-md overflow-hidden">
        <img
          src={event.image || 'https://images.unsplash.com/photo-1535223289827-42f1e9919769'}
          alt={event.title}
          className="w-full h-64 object-cover"
        />
        <div className="p-6 space-y-4">
          <h1 className="text-3xl font-bold text-gray-800">{event.title}</h1>
          <p className="text-gray-600">{event.description}</p>
          <div className="flex justify-between text-gray-700 font-semibold">
            <p>Date: {eventDate}</p>
            <p>Location: {event.location}</p>
          </div>
          {event.price && <p className="text-gray-700 font-semibold">Price: ₹{event.price}</p>}
          {event.totalSeats !== undefined && (
            <p className="text-gray-700">
              Seats Available: {event.totalSeats - (event.bookedSeats || 0)} / {event.totalSeats}
            </p>
          )}
          <Link
            href={`/book/${event._id}`}
            className="block text-center bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors"
          >
            Book Now
          </Link>
        </div>
      </div>
    </div>
  );
}
