import Link from 'next/link';
import { formatDate, formatCurrency } from '@/lib/utils';

interface Event {
  _id: string;
  title: string;
  description: string;
  location: string;
  date: Date;
  price: number;
  totalSeats: number;
  availableSeats: number;
  imageUrl: string;
  createdBy: any;
}

interface EventCardProps {
  event: Event;
}

export default function EventCardServer({ event }: EventCardProps) {
  const isSoldOut = event.availableSeats === 0;
  const almostSoldOut = event.availableSeats > 0 && event.availableSeats <= 10;

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 group border border-gray-100">
      <div className="relative">
        <img 
          src={event.imageUrl || '/api/placeholder/300/200'} 
          alt={event.title}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {isSoldOut && (
          <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
            Sold Out
          </div>
        )}
        {almostSoldOut && !isSoldOut && (
          <div className="absolute top-4 right-4 bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
            Almost Sold Out
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
          <h3 className="text-white font-semibold text-lg line-clamp-1">
            {event.title}
          </h3>
        </div>
      </div>
      
      <div className="p-6">
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {event.description}
        </p>
        
        <div className="space-y-3 mb-4">
          <div className="flex items-center text-sm text-gray-500">
            <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="truncate">{event.location}</span>
          </div>
          
          <div className="flex items-center text-sm text-gray-500">
            <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>{formatDate(event.date)}</span>
          </div>
        </div>
        
        <div className="flex justify-between items-center mb-4">
          <span className="text-2xl font-bold text-blue-600">
            {formatCurrency(event.price)}
          </span>
          <span className={`text-sm font-medium ${
            isSoldOut ? 'text-red-500' : 
            almostSoldOut ? 'text-orange-500' : 
            'text-green-500'
          }`}>
            {isSoldOut ? 'Sold Out' : `${event.availableSeats} seats left`}
          </span>
        </div>
        
        {/* Progress bar for available seats */}
        {!isSoldOut && (
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div 
              className="h-2 rounded-full transition-all duration-300"
              style={{ 
                width: `${(event.availableSeats / event.totalSeats) * 100}%`,
                backgroundColor: almostSoldOut ? '#f97316' : '#10b981'
              }}
            ></div>
          </div>
        )}
        
        <div className="flex space-x-3">
          <Link
            href={`/events/${event._id}`}
            className="flex-1 text-center py-3 px-4 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
          >
            View Details
          </Link>
          
          <Link
            href="/auth/login"
            className={`flex-1 text-center py-3 px-4 rounded-lg font-semibold transition-colors ${
              isSoldOut
                ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isSoldOut ? 'Sold Out' : 'Book Now'}
          </Link>
        </div>
        
        {event.createdBy && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              Organized by: <span className="font-medium">{event.createdBy.name}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}