// components/ui/GuestEventCard.tsx
import Link from 'next/link';
import Image from 'next/image';
import { formatDate } from '@/lib/utils';

interface Event {
  _id: string;
  title: string;
  description: string;
  location: string;
  totalSeats: number;
  availableSeats: number;
  date: string | Date;
  image?: string;
  price?: number;
}

interface EventCardProps {
  event: Event;
}

export default function GuestEventCard({ event }: EventCardProps) {
  const imageUrl = event.image || `https://picsum.photos/400/300?random=${event._id}`;

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative w-full h-64">
        <Image
          src={imageUrl}
          alt={event.title}
          fill
          className="object-cover"
          priority
        />
      </div>

      <div className="p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-2 line-clamp-2">{event.title}</h3>
        <p className="text-gray-600 mb-4 line-clamp-3">{event.description}</p>

        <div className="space-y-2 mb-4 text-gray-600 text-sm">
          <p>Date: {formatDate(new Date(event.date))}</p>
          <p>Location: {event.location}</p>
          <p>Price: ₹{event.price}</p>
          <p>{event.availableSeats} seats available</p>
        </div>

        <div className="flex space-x-3">
          <Link
            href="/auth/login"
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded text-center hover:bg-blue-700 transition-colors"
          >
            View Details
          </Link>
          {event.availableSeats > 0 ? (
            <Link
              href="/auth/login"
              className="flex-1 bg-green-600 text-white py-2 px-4 rounded text-center hover:bg-green-700 transition-colors"
            >
              Book Now
            </Link>
          ) : (
            <button
              disabled
              className="flex-1 bg-gray-400 text-white py-2 px-4 rounded cursor-not-allowed"
            >
              Sold Out
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
