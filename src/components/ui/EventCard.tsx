'use client';

import Link from 'next/link';
import Image from 'next/image';
import { formatDate } from '@/lib/utils';
import { checkUserBooking } from '@/actions/bookingActions';
import { useState, useEffect } from 'react';

interface Event {
  _id: string;
  title: string;
  description: string;
  location: string;
  totalSeats: number;
  availableSeats: number;
  date: string | Date;
  imageUrls: string[];  // Keep this as required for your existing data
  price?: number;
  category?: string;
  tags?: string[];
  time?: string;
  image?: string;        // Single image field from new model
  organizer?: {
    name: string;
    email: string;
  };
}

interface EventCardProps {
  event: Event;
}

export default function EventCard({ event }: EventCardProps) {
  const [alreadyBooked, setAlreadyBooked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);

  // Check if user already booked this event
  useEffect(() => {
    async function checkBooking() {
      try {
        const result = await checkUserBooking(event._id);
        if (result.success) {
          setAlreadyBooked(result.alreadyBooked);
        }
      } catch (error) {
        console.error('Error checking booking status:', error);
      } finally {
        setLoading(false);
      }
    }

    checkBooking();
  }, [event._id]);

  // Determine image source - FIXED VERSION
  useEffect(() => {
    // Debug log to see what image data we have
    console.log('Event image data for:', event.title, {
      imageUrls: event.imageUrls,
      image: event.image,
      hasImageUrls: event.imageUrls && event.imageUrls.length > 0,
      hasSingleImage: !!event.image
    });

    // Priority 1: Use imageUrls array (your existing data structure)
    if (event.imageUrls && Array.isArray(event.imageUrls) && event.imageUrls.length > 0) {
      const validUrl = event.imageUrls.find(url => url && url.trim() !== '');
      if (validUrl) {
        setCurrentImageUrl(validUrl);
        return;
      }
    }
    
    // Priority 2: Use single image field (new data structure)
    if (event.image && event.image.trim() !== '') {
      setCurrentImageUrl(event.image);
      return;
    }
    
    // No valid images found
    setCurrentImageUrl(null);
    setImageError(true);
  }, [event.imageUrls, event.image]);

  // Format time if available
  const formatTime = (time: string) => {
    if (!time) return '';
    try {
      const [hours, minutes] = time.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const formattedHour = hour % 12 || 12;
      return `${formattedHour}:${minutes} ${ampm}`;
    } catch {
      return time;
    }
  };

  const handleImageError = () => {
    console.error('Image failed to load:', currentImageUrl);
    setImageError(true);
  };

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 flex flex-col h-full">
      {/* Image Section - SIMPLIFIED */}
      <div className="relative w-full h-56 bg-gray-100">
        {currentImageUrl && !imageError ? (
          <>
            <Image
              src={currentImageUrl}
              alt={event.title}
              fill
              className="object-cover"
              priority={false}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              onError={handleImageError}
            />
            
            {/* Multiple Images Badge */}
            {event.imageUrls && event.imageUrls.length > 1 && (
              <div className="absolute top-3 left-3 bg-black/70 text-white px-2 py-1 rounded-full text-xs font-semibold">
                +{event.imageUrls.length - 1} more
              </div>
            )}

            {/* Category Badge */}
            {event.category && (
              <div className="absolute top-3 right-3 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-sm">
                {event.category}
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
            <div className="text-center">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <span className="text-gray-500 text-sm">No image available</span>
            </div>
          </div>
        )}
        
        {/* Available Seats Badge */}
        <div className={`absolute bottom-3 right-3 px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${
          event.availableSeats > 0 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {event.availableSeats > 0 ? `${event.availableSeats} Seats Left` : 'Sold Out'}
        </div>
      </div>

      {/* Event Info */}
      <div className="p-5 flex flex-col flex-grow">
        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 leading-tight">
          {event.title}
        </h3>
        
        {/* Tags */}
        {event.tags && event.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {event.tags.slice(0, 3).map((tag, index) => (
              <span 
                key={index}
                className="bg-gray-100 text-gray-700 px-2 py-1 rounded-md text-xs font-medium"
              >
                {tag}
              </span>
            ))}
            {event.tags.length > 3 && (
              <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-md text-xs font-medium">
                +{event.tags.length - 3} more
              </span>
            )}
          </div>
        )}

        <p className="text-sm text-gray-600 mb-4 line-clamp-2 flex-grow">
          {event.description}
        </p>

        <div className="space-y-2 text-sm text-gray-700 mb-4">
          {/* Location */}
          <div className="flex items-center">
            <svg
              className="w-4 h-4 mr-2 text-gray-500 flex-shrink-0"
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
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <span className="truncate">{event.location}</span>
          </div>

          {/* Date and Time */}
          <div className="flex items-center">
            <svg
              className="w-4 h-4 mr-2 text-gray-500 flex-shrink-0"
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
            <span>
              {formatDate(new Date(event.date))}
              {event.time && ` • ${formatTime(event.time)}`}
            </span>
          </div>

          {/* Price */}
          <div className="flex items-center">
            <svg
              className="w-4 h-4 mr-2 text-gray-500 flex-shrink-0"
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
            <span className="font-semibold">
              {event.price && event.price > 0 
                ? `₹${new Intl.NumberFormat('en-IN').format(event.price)} per ticket`
                : 'Free Entry'
              }
            </span>
          </div>

          {/* Organizer */}
          {event.organizer && (
            <div className="flex items-center">
              <svg
                className="w-4 h-4 mr-2 text-gray-500 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              <span className="truncate">By {event.organizer.name}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-auto flex space-x-3">
          <Link
            href={`/events/${event._id}`}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg text-center text-sm font-medium hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center"
          >
            View Details
          </Link>
          
          {loading ? (
            <button
              disabled
              className="flex-1 bg-gray-400 text-white py-2 px-4 rounded-lg text-center text-sm font-medium cursor-not-allowed flex items-center justify-center"
            >
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Checking...
            </button>
          ) : alreadyBooked ? (
            <button
              disabled
              className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg text-center text-sm font-medium cursor-not-allowed flex items-center justify-center"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Booked
            </button>
          ) : event.availableSeats > 0 ? (
            <Link
              href={`/events/${event._id}/book`}
              className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg text-center text-sm font-medium hover:bg-green-700 transition-colors duration-200 flex items-center justify-center"
            >
              Book Now
            </Link>
          ) : (
            <button
              disabled
              className="flex-1 bg-gray-400 text-white py-2 px-4 rounded-lg text-center text-sm font-medium cursor-not-allowed flex items-center justify-center"
            >
              Sold Out
            </button>
          )}
        </div>
      </div>
    </div>
  );
}