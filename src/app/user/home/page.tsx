export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { redirect } from 'next/navigation';
import { getEvents } from '@/actions/eventActions';
import { getToken } from '@/actions/authActions';
import { getCurrentUser } from '@/lib/auth';
import EventCard from '@/components/ui/EventCard';
import SearchBar from '@/components/shared/SearchBar';
import { searchEvents, getEventsByCategory } from '@/actions/userActions';
import { getCategories } from '@/actions/categoryActions';

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

  // Fetch dynamic categories
  const categoriesResult = await getCategories();
  const CATEGORIES = categoriesResult.success && categoriesResult.categories ? 
    categoriesResult.categories.map(cat => ({
      value: cat.name,
      label: cat.name,
      icon: cat.icon,
      color: 'bg-blue-100', // Default colors
      textColor: 'text-blue-600',
      description: cat.description
    })) : [];

  // Await the searchParams promise
  const params = await searchParams;
  const searchQuery = typeof params.q === 'string' ? params.q : '';
  const category = typeof params.category === 'string' ? params.category : '';
  
  let events: any[] = [];
  
  // USE SEARCH FUNCTIONALITY
  if (category) {
    // Use category-specific search
    const searchResult = await getEventsByCategory(category);
    if (searchResult.success) {
      events = searchResult.events;
    }
  } else if (searchQuery) {
    // Use general search
    const searchResult = await searchEvents(searchQuery);
    if (searchResult.success) {
      events = searchResult.events;
    }
  } else {
    // Use original getEvents when no search
    const eventsResult = await getEvents({});
    events = eventsResult.success && eventsResult.events ? eventsResult.events : [];
  }

  // Filter upcoming events (events with future dates)
  const upcomingEvents = events.filter((event: any) => {
    const eventDate = new Date(event.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day
    return eventDate >= today;
  });

  // Group events by actual category from the database
  const eventsByCategory: { [key: string]: any[] } = {};
  
  // Initialize all categories
  CATEGORIES.forEach(cat => {
    eventsByCategory[cat.value] = [];
  });

  // Also initialize for any categories that exist in events but not in CATEGORIES
  upcomingEvents.forEach(event => {
    const eventCategory = event.category;
    if (eventCategory && !eventsByCategory[eventCategory]) {
      eventsByCategory[eventCategory] = [];
    }
  });

  // Populate events by their actual category
  upcomingEvents.forEach(event => {
    const eventCategory = event.category;
    if (eventCategory && eventsByCategory[eventCategory]) {
      eventsByCategory[eventCategory].push(event);
    } else if (CATEGORIES.length > 0) {
      // If category doesn't exist or event has no category, put it in first available category
      eventsByCategory[CATEGORIES[0].value].push(event);
    }
  });

  // Get category display info with counts
  const categoriesWithCounts = CATEGORIES.map(category => ({
    ...category,
    count: eventsByCategory[category.value]?.length || 0
  })).filter(category => category.count > 0); // Only show categories that have events

  // Also include categories from events that might not be in the categories list
  Object.keys(eventsByCategory).forEach(categoryName => {
    if (!CATEGORIES.find(cat => cat.value === categoryName) && eventsByCategory[categoryName].length > 0) {
      categoriesWithCounts.push({
        value: categoryName,
        label: categoryName,
        icon: '🎯',
        color: 'bg-gray-100',
        textColor: 'text-gray-600',
        description: `Events in ${categoryName} category`,
        count: eventsByCategory[categoryName].length
      });
    }
  });

  // Helper function to get category info
  const getCategoryInfo = (categoryValue: string) => {
    return CATEGORIES.find(cat => cat.value === categoryValue) || 
           categoriesWithCounts.find(cat => cat.value === categoryValue) || 
           { value: 'other', label: 'Other', icon: '🎯', color: 'bg-gray-100', textColor: 'text-gray-600', description: 'Various events' };
  };

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

        {/* Search Results Info */}
        {(searchQuery || category) && (
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-semibold mb-2">
              {upcomingEvents.length > 0 
                ? `Found ${upcomingEvents.length} events`
                : `No events found`
              }
            </h2>
            {(searchQuery || category) && (
              <p className="text-gray-600">
                {searchQuery && `for "${searchQuery}"`}
                {searchQuery && category && ' in '}
                {category && `category: ${getCategoryInfo(category)?.label}`}
              </p>
            )}
          </div>
        )}

        {/* Categories Section */}
        <section className="mb-16">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-800 mb-3">Browse by Category</h2>
            <p className="text-gray-600">Find events that match your interests</p>
          </div>
          
          {categoriesWithCounts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {/* All Events Card */}
              <a
                href="/user/home"
                className="bg-white rounded-xl p-4 text-center shadow-md hover:shadow-lg transition-shadow cursor-pointer border border-gray-100 block no-underline"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">📅</span>
                </div>
                <h3 className="font-semibold text-gray-800 mb-1">All Events</h3>
                <p className="text-sm font-medium text-blue-600">
                  {upcomingEvents.length} event{upcomingEvents.length !== 1 ? 's' : ''}
                </p>
              </a>

              {/* Category Cards */}
              {categoriesWithCounts.map((category) => (
                <a
                  key={category.value}
                  href={`/user/home?category=${encodeURIComponent(category.value)}`}
                  className="bg-white rounded-xl p-4 text-center shadow-md hover:shadow-lg transition-shadow cursor-pointer border border-gray-100 block no-underline"
                >
                  <div className={`w-12 h-12 ${category.color} rounded-full flex items-center justify-center mx-auto mb-3`}>
                    <span className="text-2xl">{category.icon}</span>
                  </div>
                  <h3 className="font-semibold text-gray-800 mb-1">{category.label}</h3>
                  <p className={`text-sm font-medium ${category.textColor}`}>
                    {category.count} event{category.count !== 1 ? 's' : ''}
                  </p>
                </a>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600">No categories with events available yet.</p>
            </div>
          )}
        </section>

        {/* Featured Events by Category */}
        <div className="space-y-16 mb-16">
          {/* Show events for each category that has events */}
          {categoriesWithCounts
            .filter(category => category.count > 0)
            .map(category => (
              <section key={category.value}>
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center space-x-3">
                    <div className={`w-12 h-12 ${category.color} rounded-xl flex items-center justify-center`}>
                      <span className="text-2xl">{category.icon}</span>
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold text-gray-800">{category.label}</h2>
                      <p className="text-gray-600">
                        {category.description || getCategoryDescription(category.value)}
                      </p>
                    </div>
                  </div>
                  {category.count > 3 && (
                    <a 
                      href={`/user/home?category=${encodeURIComponent(category.value)}`}
                      className="text-blue-600 hover:text-blue-800 font-semibold"
                    >
                      View All ({category.count})
                    </a>
                  )}
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {eventsByCategory[category.value].slice(0, 3).map((event: any) => (
                    <EventCard key={event._id.toString()} event={event} />
                  ))}
                </div>
              </section>
            ))
          }
        </div>

        {/* All Events Section */}
        <section id="all-events" className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              {searchQuery || category ? 'Search Results' : 'All Upcoming Events'}
            </h2>
            <p className="text-gray-600">
              {searchQuery || category 
                ? 'Events matching your search criteria' 
                : 'Discover all events happening near you'
              }
            </p>
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
                {searchQuery || category 
                  ? 'No events found matching your search. Try different keywords.' 
                  : 'Check back soon for new events!'
                }
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

// Helper function for category descriptions
function getCategoryDescription(category: string): string {
  const descriptions: { [key: string]: string } = {
    music: 'Experience live performances and concerts',
    sports: 'Cheer for your favorite teams and athletes',
    arts: 'Explore creative masterpieces and exhibitions',
    business: 'Network and learn from industry leaders',
    technology: 'Stay updated with the latest tech trends',
    food: 'Taste delicious cuisines and culinary delights',
    health: 'Focus on wellness and healthy living',
    education: 'Learn and grow with educational events',
    other: 'Discover various interesting events'
  };
  return descriptions[category.toLowerCase()] || `Explore ${category} events`;
}