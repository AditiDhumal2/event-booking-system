import Link from 'next/link';
import Image from 'next/image';
import { getEventById } from '@/actions/eventActions';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EventDetailPage({ params }: PageProps) {
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
  const imageUrls = Array.isArray(event.imageUrls) ? event.imageUrls : [];

  return (
    <div className="max-w-6xl mx-auto p-6">
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
            {/* View Bookings Button */}
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
        {/* Image Gallery */}
        {imageUrls.length > 0 ? (
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Event Images ({imageUrls.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {imageUrls.map((imageUrl: string, index: number) => (
                <div key={index} className="relative group">
                  <div className="relative h-64 w-full overflow-hidden rounded-lg bg-gray-100">
                    <Image
                      src={imageUrl}
                      alt={`${event.title} - Image ${index + 1}`}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  </div>
                  <div className="absolute top-2 right-2 bg-black bg-opacity-60 text-white px-2 py-1 rounded-md text-xs">
                    Image {index + 1}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-6 border-b bg-gray-50">
            <div className="text-center py-8">
              <div className="text-gray-400 text-sm mb-2">No images uploaded for this event</div>
              <div className="relative h-48 w-full max-w-md mx-auto bg-gray-200 rounded-lg flex items-center justify-center">
                <span className="text-gray-500">No Image Available</span>
              </div>
            </div>
          </div>
        )}
        
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Event Details</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="md:col-span-2">
              <h3 className="text-sm font-medium text-gray-500">Description</h3>
              <p className="mt-1 text-gray-800 whitespace-pre-line">{event.description}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">Date & Time</h3>
              <p className="mt-1 text-gray-800">
                {new Date(event.date).toLocaleDateString('en-IN', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
              <p className="mt-1 text-gray-600 text-sm">
                {new Date(event.date).toLocaleTimeString('en-IN', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
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
                <span className={`font-semibold ${
                  event.availableSeats > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {event.availableSeats} available
                </span>{' '}
                out of {event.totalSeats} total seats
              </p>
              {event.availableSeats === 0 && (
                <p className="mt-1 text-red-600 text-sm font-medium">Event is sold out</p>
              )}
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">Created By</h3>
              <p className="mt-1 text-gray-800">
                {event.createdBy.name} ({event.createdBy.email})
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">Created On</h3>
              <p className="mt-1 text-gray-800">
                {new Date(event.createdAt).toLocaleDateString('en-IN')}
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