'use client';

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
  imageUrls: string[];
  price?: number;
}

interface EventCardProps {
  event: Event;
}

export default function EventCard({ event }: EventCardProps) {
  // Only use uploaded images - no fallback to random images
  const hasImages = event.imageUrls && event.imageUrls.length > 0;
  const imageUrl = hasImages ? event.imageUrls[0] : null;

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 flex flex-col">
      {/* Image Section */}
      <div className="relative w-full h-56">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={event.title}
            fill
            className="object-cover"
            priority={true}
          />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
            <span className="text-gray-500 text-sm">No Image</span>
          </div>
        )}
        
        <div className="absolute top-3 right-3 bg-white/90 px-3 py-1 rounded-full text-xs font-semibold text-gray-800 shadow-sm">
          {event.availableSeats > 0 ? `${event.availableSeats} Left` : 'Sold Out'}
        </div>
        
        {/* Multiple Images Badge */}
        {hasImages && event.imageUrls.length > 1 && (
          <div className="absolute top-3 left-3 bg-black/70 text-white px-2 py-1 rounded-full text-xs font-semibold">
            +{event.imageUrls.length - 1} more
          </div>
        )}
      </div>

      {/* Event Info */}
      <div className="p-5 flex flex-col flex-grow">
        <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-2">
          {event.title}
        </h3>
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {event.description}
        </p>

        <div className="space-y-2 text-sm text-gray-700 mb-4">
          {/* Location */}
          <div className="flex items-center">
            <svg
              className="w-4 h-4 mr-2 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z"
              />
            </svg>
            <span>{event.location}</span>
          </div>

          {/* Date */}
          <div className="flex items-center">
            <svg
              className="w-4 h-4 mr-2 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span>{formatDate(new Date(event.date))}</span>
          </div>

          {/* Price */}
          {event.price && (
            <div className="flex items-center">
              <svg
                className="w-4 h-4 mr-2 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                />
              </svg>
              <span>
                ₹{new Intl.NumberFormat('en-IN').format(event.price)} per ticket
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-auto flex space-x-3">
          <Link
            href={`/events/${event._id}`}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg text-center text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            View Details
          </Link>
          {event.availableSeats > 0 ? (
            <Link
              href={`/events/${event._id}/book`}
              className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg text-center text-sm font-medium hover:bg-green-700 transition-colors"
            >
              Book Now
            </Link>
          ) : (
            <button
              disabled
              className="flex-1 bg-gray-400 text-white py-2 px-4 rounded-lg text-center text-sm font-medium cursor-not-allowed"
            >
              Sold Out
            </button>
          )}
        </div>
      </div>
    </div>
  );
}