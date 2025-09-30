import { redirect } from 'next/navigation';
import { getToken } from '@/actions/authActions';
import { getCurrentUser } from '@/lib/auth';
import { getEventById } from '@/actions/eventActions';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';
import Image from 'next/image';

interface EventPageProps {
  params: Promise<{ id: string }>;
}

export default async function EventPage({ params }: EventPageProps) {
  // Await the params promise first
  const { id } = await params;
  
  // Check if id exists
  if (!id) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl text-red-600">Event ID not found.</p>
      </div>
    );
  }

  const token = await getToken();
  if (!token) {
    redirect('/auth/login');
  }

  const userDoc = await getCurrentUser(token);
  if (!userDoc) {
    redirect('/auth/login');
  }

  // Fetch event by ID using your server action
  const eventResult = await getEventById(id);

  if (!eventResult.success || !eventResult.event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Event Not Found</h1>
          <p className="text-gray-600 mb-4">The event you're looking for doesn't exist or has been removed.</p>
          <Link 
            href="/user/home" 
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Homepage
          </Link>
        </div>
      </div>
    );
  }

  const event = eventResult.event;
  const imageUrls = Array.isArray(event.imageUrls) ? event.imageUrls : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Back Button */}
        <div className="mb-6">
          <Link 
            href="/user/home"
            className="inline-flex items-center text-blue-600 hover:text-blue-800"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Homepage
          </Link>
        </div>

        {/* Event Header and Image Gallery */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
          {/* Image Gallery Section */}
          {imageUrls.length > 0 ? (
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Event Gallery ({imageUrls.length} images)</h2>
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
                <div className="text-gray-400 text-sm mb-2">No images available for this event</div>
                <div className="relative h-48 w-full max-w-md mx-auto bg-gray-200 rounded-lg flex items-center justify-center">
                  <span className="text-gray-500">No Event Images</span>
                </div>
              </div>
            </div>
          )}

          {/* Event Details */}
          <div className="p-8">
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <h1 className="text-4xl font-bold text-gray-800 mb-2">{event.title}</h1>
                <p className="text-xl text-gray-600">{event.description}</p>
              </div>
              
              <div className="ml-6">
                {event.availableSeats > 0 ? (
                  <Link
                    href={`/events/${event._id}/book`}
                    className="bg-green-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-green-700 transition-colors block text-center"
                  >
                    Book Now
                  </Link>
                ) : (
                  <button
                    disabled
                    className="bg-gray-400 text-white px-8 py-3 rounded-lg text-lg font-semibold cursor-not-allowed"
                  >
                    Sold Out
                  </button>
                )}
                <div className="mt-2 text-center">
                  <span className={`text-sm font-medium ${
                    event.availableSeats > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {event.availableSeats > 0 ? `${event.availableSeats} seats available` : 'Fully booked'}
                  </span>
                </div>
              </div>
            </div>

            {/* Event Details Grid */}
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-4">
                <div className="flex items-center text-gray-700">
                  <svg className="w-5 h-5 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z" />
                  </svg>
                  <span className="font-medium">Location:</span>
                  <span className="ml-2">{event.location}</span>
                </div>

                <div className="flex items-center text-gray-700">
                  <svg className="w-5 h-5 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="font-medium">Date:</span>
                  <span className="ml-2">{formatDate(new Date(event.date))}</span>
                </div>

                <div className="flex items-center text-gray-700">
                  <svg className="w-5 h-5 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                  <span className="font-medium">Price:</span>
                  <span className="ml-2">₹{event.price.toLocaleString('en-IN')} per ticket</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center text-gray-700">
                  <svg className="w-5 h-5 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                  </svg>
                  <span className="font-medium">Available Seats:</span>
                  <span className="ml-2">{event.availableSeats} of {event.totalSeats}</span>
                </div>

                <div className="flex items-center text-gray-700">
                  <svg className="w-5 h-5 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="font-medium">Organizer:</span>
                  <span className="ml-2">{event.createdBy?.name || 'Unknown'}</span>
                </div>

                <div className="flex items-center text-gray-700">
                  <svg className="w-5 h-5 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-medium">Status:</span>
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                    event.availableSeats > 0 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {event.availableSeats > 0 ? 'Available' : 'Sold Out'}
                  </span>
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Event Information</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p>• Please arrive 30 minutes before the event starts</p>
                <p>• Bring your booking confirmation and ID</p>
                <p>• Seating is on a first-come, first-served basis</p>
                <p>• Cancellations are allowed up to 24 hours before the event</p>
                {event.availableSeats < 10 && event.availableSeats > 0 && (
                  <p className="text-orange-600 font-medium">• Only {event.availableSeats} seats left! Book soon to secure your spot.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 justify-center">
          <Link
            href="/user/home"
            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-center"
          >
            Back to Homepage
          </Link>
          
          {event.availableSeats > 0 && (
            <Link
              href={`/events/${event._id}/book`}
              className="bg-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors text-center"
            >
              Book Tickets Now
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}