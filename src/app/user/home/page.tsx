// app/user/home/page.tsx
import { redirect } from 'next/navigation';
import { getEvents } from '@/actions/eventActions';
import { getToken } from '@/actions/authActions';
import { getCurrentUser } from '@/lib/auth';
import EventCard from '@/components/ui/EventCard';
import SearchBar from '@/components/shared/SearchBar';

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function UserHomePage({ searchParams }: PageProps) {
  const token = await getToken();
  if (!token) {
    redirect('/auth/login');
  }

  const userDoc = await getCurrentUser(token);
  if (!userDoc) {
    redirect('/auth/login');
  }

  if (userDoc.role === 'admin') {
    redirect('/admin/dashboard');
  }

  // Await the searchParams promise
  const params = await searchParams;
  const searchQuery = typeof params.q === 'string' ? params.q : '';
  const filters = searchQuery ? { title: { $regex: searchQuery, $options: 'i' } } : {};
  
  const eventsResult = await getEvents(filters);
  
  // Provide safe fallback for undefined events - FIXED THE TYPESCRIPT ERROR
  const events = eventsResult.success && eventsResult.events ? eventsResult.events : [];

  // Filter upcoming events (events with future dates)
  const upcomingEvents = events.filter((event: any) => {
    const eventDate = new Date(event.date);
    const today = new Date();
    return eventDate >= today;
  });

  // Categorize events
  const musicEvents = upcomingEvents.filter((event: any) => 
    event.title.toLowerCase().includes('music') || 
    event.title.toLowerCase().includes('concert') ||
    event.title.toLowerCase().includes('festival') ||
    event.description.toLowerCase().includes('music') ||
    event.description.toLowerCase().includes('concert')
  );

  const artEvents = upcomingEvents.filter((event: any) => 
    event.title.toLowerCase().includes('art') || 
    event.title.toLowerCase().includes('exhibition') ||
    event.title.toLowerCase().includes('gallery') ||
    event.description.toLowerCase().includes('art') ||
    event.description.toLowerCase().includes('painting') ||
    event.description.toLowerCase().includes('sculpture')
  );

  const techEvents = upcomingEvents.filter((event: any) => 
    event.title.toLowerCase().includes('tech') || 
    event.title.toLowerCase().includes('conference') ||
    event.title.toLowerCase().includes('workshop') ||
    event.title.toLowerCase().includes('startup') ||
    event.description.toLowerCase().includes('technology') ||
    event.description.toLowerCase().includes('programming') ||
    event.description.toLowerCase().includes('coding')
  );

  const sportsEvents = upcomingEvents.filter((event: any) => 
    event.title.toLowerCase().includes('sports') || 
    event.title.toLowerCase().includes('game') ||
    event.title.toLowerCase().includes('tournament') ||
    event.description.toLowerCase().includes('sports') ||
    event.description.toLowerCase().includes('competition') ||
    event.description.toLowerCase().includes('match')
  );

  const foodEvents = upcomingEvents.filter((event: any) => 
    event.title.toLowerCase().includes('food') || 
    event.title.toLowerCase().includes('culinary') ||
    event.title.toLowerCase().includes('festival') ||
    event.description.toLowerCase().includes('food') ||
    event.description.toLowerCase().includes('cuisine') ||
    event.description.toLowerCase().includes('cooking')
  );

  const businessEvents = upcomingEvents.filter((event: any) => 
    event.title.toLowerCase().includes('business') || 
    event.title.toLowerCase().includes('networking') ||
    event.title.toLowerCase().includes('seminar') ||
    event.description.toLowerCase().includes('business') ||
    event.description.toLowerCase().includes('networking') ||
    event.description.toLowerCase().includes('entrepreneur')
  );

  // All categories for display
  const categories = [
    {
      name: "Music",
      count: musicEvents.length,
      icon: "🎵",
      color: "bg-blue-100",
      textColor: "text-blue-600"
    },
    {
      name: "Art",
      count: artEvents.length,
      icon: "🎨",
      color: "bg-purple-100",
      textColor: "text-purple-600"
    },
    {
      name: "Technology",
      count: techEvents.length,
      icon: "💻",
      color: "bg-green-100",
      textColor: "text-green-600"
    },
    {
      name: "Sports",
      count: sportsEvents.length,
      icon: "⚽",
      color: "bg-red-100",
      textColor: "text-red-600"
    },
    {
      name: "Food",
      count: foodEvents.length,
      icon: "🍕",
      color: "bg-yellow-100",
      textColor: "text-yellow-600"
    },
    {
      name: "Business",
      count: businessEvents.length,
      icon: "💼",
      color: "bg-indigo-100",
      textColor: "text-indigo-600"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Welcome back, {userDoc.name}! 👋
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Discover amazing events and book your tickets instantly
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-12 max-w-2xl mx-auto">
          <SearchBar placeholder="Search events by name, location, or category..." />
        </div>

        {/* Categories Section */}
        <section className="mb-16">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-800 mb-3">Browse by Category</h2>
            <p className="text-gray-600">Find events that match your interests</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((category) => (
              <div
                key={category.name}
                className="bg-white rounded-xl p-4 text-center shadow-md hover:shadow-lg transition-shadow cursor-pointer border border-gray-100"
              >
                <div className={`w-12 h-12 ${category.color} rounded-full flex items-center justify-center mx-auto mb-3`}>
                  <span className="text-2xl">{category.icon}</span>
                </div>
                <h3 className="font-semibold text-gray-800 mb-1">{category.name}</h3>
                <p className={`text-sm font-medium ${category.textColor}`}>
                  {category.count} event{category.count !== 1 ? 's' : ''}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Featured Events by Category */}
        <div className="space-y-16 mb-16">
          {/* Music Concerts Section */}
          {musicEvents.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <span className="text-2xl">🎵</span>
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-gray-800">Music Concerts</h2>
                    <p className="text-gray-600">Experience live performances</p>
                  </div>
                </div>
                {musicEvents.length > 3 && (
                  <a href="#all-events" className="text-blue-600 hover:text-blue-800 font-semibold">
                    View All ({musicEvents.length})
                  </a>
                )}
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {musicEvents.slice(0, 3).map((event: any) => (
                  <EventCard key={event._id.toString()} event={event} />
                ))}
              </div>
            </section>
          )}

          {/* Art Exhibitions Section */}
          {artEvents.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                    <span className="text-2xl">🎨</span>
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-gray-800">Art Exhibitions</h2>
                    <p className="text-gray-600">Explore creative masterpieces</p>
                  </div>
                </div>
                {artEvents.length > 3 && (
                  <a href="#all-events" className="text-blue-600 hover:text-blue-800 font-semibold">
                    View All ({artEvents.length})
                  </a>
                )}
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {artEvents.slice(0, 3).map((event: any) => (
                  <EventCard key={event._id.toString()} event={event} />
                ))}
              </div>
            </section>
          )}

          {/* Tech Conferences Section */}
          {techEvents.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <span className="text-2xl">💻</span>
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-gray-800">Tech Conferences</h2>
                    <p className="text-gray-600">Learn from industry experts</p>
                  </div>
                </div>
                {techEvents.length > 3 && (
                  <a href="#all-events" className="text-blue-600 hover:text-blue-800 font-semibold">
                    View All ({techEvents.length})
                  </a>
                )}
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {techEvents.slice(0, 3).map((event: any) => (
                  <EventCard key={event._id.toString()} event={event} />
                ))}
              </div>
            </section>
          )}

          {/* Sports Events Section */}
          {sportsEvents.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                    <span className="text-2xl">⚽</span>
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-gray-800">Sports Events</h2>
                    <p className="text-gray-600">Cheer for your favorite teams</p>
                  </div>
                </div>
                {sportsEvents.length > 3 && (
                  <a href="#all-events" className="text-blue-600 hover:text-blue-800 font-semibold">
                    View All ({sportsEvents.length})
                  </a>
                )}
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {sportsEvents.slice(0, 3).map((event: any) => (
                  <EventCard key={event._id.toString()} event={event} />
                ))}
              </div>
            </section>
          )}

          {/* Food Events Section */}
          {foodEvents.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                    <span className="text-2xl">🍕</span>
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-gray-800">Food Festivals</h2>
                    <p className="text-gray-600">Taste delicious cuisines</p>
                  </div>
                </div>
                {foodEvents.length > 3 && (
                  <a href="#all-events" className="text-blue-600 hover:text-blue-800 font-semibold">
                    View All ({foodEvents.length})
                  </a>
                )}
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {foodEvents.slice(0, 3).map((event: any) => (
                  <EventCard key={event._id.toString()} event={event} />
                ))}
              </div>
            </section>
          )}

          {/* Business Events Section */}
          {businessEvents.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                    <span className="text-2xl">💼</span>
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-gray-800">Business Events</h2>
                    <p className="text-gray-600">Network and grow professionally</p>
                  </div>
                </div>
                {businessEvents.length > 3 && (
                  <a href="#all-events" className="text-blue-600 hover:text-blue-800 font-semibold">
                    View All ({businessEvents.length})
                  </a>
                )}
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {businessEvents.slice(0, 3).map((event: any) => (
                  <EventCard key={event._id.toString()} event={event} />
                ))}
              </div>
            </section>
          )}
        </div>

        {/* All Events Section */}
        <section id="all-events" className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">All Upcoming Events</h2>
            <p className="text-gray-600">Discover all events happening near you</p>
          </div>
          
          {upcomingEvents.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {upcomingEvents.map((event: any) => (
                <EventCard key={event._id.toString()} event={event} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-2xl shadow-lg">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold text-gray-800 mb-3">No Events Available</h3>
              <p className="text-gray-600 max-w-md mx-auto">
                {searchQuery 
                  ? 'No events found matching your search. Try different keywords.' 
                  : 'Check back soon for new events!'
                }
              </p>
            </div>
          )}
        </section>

        {/* Newsletter Section */}
        <section className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-center text-white mb-16">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold mb-4">Never Miss an Event</h2>
            <p className="text-blue-100 mb-6">
              Subscribe to our newsletter and be the first to know about upcoming events, exclusive deals, and special offers.
            </p>
            <div className="flex max-w-md mx-auto gap-4">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 rounded-lg border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200 text-gray-800"
              />
              <button className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                Subscribe
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}