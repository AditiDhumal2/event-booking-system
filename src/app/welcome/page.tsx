import Link from 'next/link';
import { getEvents } from '@/actions/eventActions';
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

// Guest EventCard: links always go to /auth/login
function GuestEventCard({ event }: { event: Event }) {
  // Use imageUrls instead of image
  const imageUrls = Array.isArray(event.imageUrls) ? event.imageUrls : [];
  const hasImages = imageUrls.length > 0;
  const firstImageUrl = hasImages ? imageUrls[0] : `https://picsum.photos/400/300?random=${event._id}`;

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative w-full h-64">
        {firstImageUrl ? (
          <Image
            src={firstImageUrl}
            alt={event.title}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
            <span className="text-gray-500 text-sm">No image available</span>
          </div>
        )}
        
        {/* Multiple Images Badge */}
        {imageUrls.length > 1 && (
          <div className="absolute top-3 left-3 bg-black/70 text-white px-2 py-1 rounded-full text-xs font-semibold">
            +{imageUrls.length - 1} more
          </div>
        )}
        
        {/* Available Seats Badge */}
        <div className="absolute top-3 right-3 bg-white/90 px-3 py-1 rounded-full text-xs font-semibold text-gray-800 shadow-sm">
          {event.availableSeats > 0 ? `${event.availableSeats} Left` : 'Sold Out'}
        </div>
      </div>

      <div className="p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-2 line-clamp-2">{event.title}</h3>
        <p className="text-gray-600 mb-4 line-clamp-3">{event.description}</p>

        <div className="space-y-2 mb-4 text-gray-600 text-sm">
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>{formatDate(new Date(event.date))}</span>
          </div>
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>{event.location}</span>
          </div>
          {event.price && (
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
              <span>₹{new Intl.NumberFormat('en-IN').format(event.price)} per ticket</span>
            </div>
          )}
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

export default async function WelcomePage() {
  // Fetch featured events
  const eventsResult = await getEvents({});
  const featuredEvents = eventsResult.success && eventsResult.events
    ? eventsResult.events.slice(0, 3)
    : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-800 mb-6">Welcome to EventBook</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10">
            Discover and book tickets for the best events in your city. From concerts to conferences, we've got you covered.
          </p>
          <Link
            href="/auth/login"
            className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition duration-300 inline-block"
          >
            Get Started
          </Link>
        </div>

        {/* Featured Events */}
        {featuredEvents.length > 0 ? (
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-gray-800 text-center mb-12">Featured Events</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {featuredEvents.map(event => (
                <GuestEventCard key={event._id} event={event} />
              ))}
            </div>
          </div>
        ) : (
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">No Events Available</h2>
            <p className="text-gray-600">Check back later for upcoming events!</p>
          </div>
        )}

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white p-8 rounded-2xl shadow-lg text-center hover:shadow-xl transition-shadow">
            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl">🎵</span>
            </div>
            <h3 className="text-xl font-semibold mb-3">Music Concerts</h3>
            <p className="text-gray-600">Experience live performances from your favorite artists</p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-lg text-center hover:shadow-xl transition-shadow">
            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl">🎨</span>
            </div>
            <h3 className="text-xl font-semibold mb-3">Art Exhibitions</h3>
            <p className="text-gray-600">Explore creative masterpieces from talented artists</p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-lg text-center hover:shadow-xl transition-shadow">
            <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl">💻</span>
            </div>
            <h3 className="text-xl font-semibold mb-3">Tech Conferences</h3>
            <p className="text-gray-600">Learn from industry experts and network with professionals</p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-6">Ready to get started?</h2>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/auth/register"
              className="bg-white text-blue-600 px-8 py-3 rounded-lg border-2 border-blue-600 font-semibold hover:bg-blue-50 transition duration-300"
            >
              Sign Up
            </Link>
            <Link
              href="/auth/login"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition duration-300"
            >
              Login
            </Link>
          </div>
        </div>

        {/* Additional Info Section */}
        <div className="mt-16 grid md:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-2xl shadow-lg">
            <h3 className="text-xl font-semibold mb-4">How It Works</h3>
            <ol className="list-decimal list-inside space-y-2 text-gray-600">
              <li>Browse events and find something you love</li>
              <li>Create an account or login</li>
              <li>Book your tickets securely</li>
              <li>Receive confirmation and enjoy the event!</li>
            </ol>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-lg">
            <h3 className="text-xl font-semibold mb-4">Why Choose EventBook?</h3>
            <ul className="space-y-2 text-gray-600">
              <li>✓ Wide variety of events</li>
              <li>✓ Secure payment processing</li>
              <li>✓ Instant booking confirmation</li>
              <li>✓ Easy event management</li>
              <li>✓ 24/7 customer support</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}