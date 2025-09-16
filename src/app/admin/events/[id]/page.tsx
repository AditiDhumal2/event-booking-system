import Link from 'next/link';
import { getEventById } from '@/actions/eventActions';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EventDetailPage({ params }: PageProps) {
  // Unwrap the params promise
  const { id } = await params;
  
  const result = await getEventById(id);

  if (!result.success) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="p-4 bg-red-100 text-red-700 rounded-md">
          Error: {result.error}
        </div>
        <Link 
          href="/admin/events"
          className="mt-4 inline-block text-blue-600 hover:text-blue-800"
        >
          ← Back to Events
        </Link>
      </div>
    );
  }

  const event = result.event!;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <Link 
          href="/admin/events"
          className="text-blue-600 hover:text-blue-800 mb-4 inline-block"
        >
          ← Back to Events
        </Link>
        
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">{event.title}</h1>
            <p className="text-gray-600 mt-2">{event.location}</p>
            <p className="text-gray-600">
              {new Date(event.date).toLocaleDateString()} • 
              ₹{event.price.toLocaleString('en-IN')} • 
              {event.availableSeats} / {event.totalSeats} seats available
            </p>
          </div>
          
          <div className="flex space-x-2">
            <Link
              href={`/admin/events/${event._id}/bookings`}
              className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md transition-colors"
            >
              View Bookings
            </Link>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {event.imageUrl && (
          <div className="h-64 w-full overflow-hidden">
            <img 
              src={event.imageUrl} 
              alt={event.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Event Details</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Description</h3>
              <p className="mt-1 text-gray-800">{event.description}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">Date & Time</h3>
              <p className="mt-1 text-gray-800">
                {new Date(event.date).toLocaleDateString()} at{' '}
                {new Date(event.date).toLocaleTimeString()}
              </p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">Location</h3>
              <p className="mt-1 text-gray-800">{event.location}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">Pricing</h3>
              <p className="mt-1 text-gray-800">₹{event.price.toLocaleString('en-IN')} per ticket</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">Seating Capacity</h3>
              <p className="mt-1 text-gray-800">
                {event.availableSeats} available out of {event.totalSeats} total seats
              </p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">Created By</h3>
              <p className="mt-1 text-gray-800">
                {event.createdBy.name} ({event.createdBy.email})
              </p>
            </div>
          </div>
          
          <div className="border-t pt-4">
            <h3 className="text-sm font-medium text-gray-500">Event ID</h3>
            <p className="mt-1 text-sm text-gray-600 font-mono">{event._id}</p>
          </div>
        </div>
      </div>
    </div>
  );
}