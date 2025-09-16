import { redirect } from 'next/navigation';
import { getToken } from '@/actions/authActions';
import { getCurrentUser } from '@/lib/auth';
import { getEvents } from '@/actions/eventActions';
import { User } from '@/models/User';
import { Booking } from '@/models/Booking';
import dbConnect from '@/lib/mongoose';
import { formatDate } from '@/lib/utils';

export default async function AdminDashboard() {
  const token = await getToken();
  if (!token) {
    redirect('/auth/login');
  }

  const userDoc = await getCurrentUser(token);
  if (!userDoc) {
    redirect('/auth/login');
  }

  if (userDoc.role !== 'admin') {
    redirect('/user/home');
  }

  await dbConnect();
  
  // Get stats
  const totalEvents = await dbConnect().then(async () => {
    const { Event } = await import('@/models/Event');
    return Event.countDocuments();
  });

  const upcomingEvents = await dbConnect().then(async () => {
    const { Event } = await import('@/models/Event');
    return Event.countDocuments({ date: { $gte: new Date() } });
  });

  const pastEvents = await dbConnect().then(async () => {
    const { Event } = await import('@/models/Event');
    return Event.countDocuments({ date: { $lt: new Date() } });
  });

  const totalUsers = await dbConnect().then(async () => {
    const { User } = await import('@/models/User');
    return User.countDocuments({ role: 'user' });
  });

  const totalBookings = await dbConnect().then(async () => {
    const { Booking } = await import('@/models/Booking');
    return Booking.countDocuments();
  });
  
  // Get recent events (✅ FIXED null safety)
  const eventsResult = await getEvents({ date: { $gte: new Date() } });
  const upcomingEventsList = eventsResult.success ? (eventsResult.events ?? []).slice(0, 5) : [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Admin Dashboard</h1>

        {/* Welcome Message */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">
            Welcome back, {userDoc.name}!
          </h2>
          <p className="text-gray-600">Manage your event booking system</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <h2 className="text-2xl font-bold text-gray-800">{totalEvents}</h2>
                <p className="text-gray-600">Total Events</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="ml-4">
                <h2 className="text-2xl font-bold text-gray-800">{upcomingEvents}</h2>
                <p className="text-gray-600">Upcoming Events</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <h2 className="text-2xl font-bold text-gray-800">{totalUsers}</h2>
                <p className="text-gray-600">Total Users</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
              </div>
              <div className="ml-4">
                <h2 className="text-2xl font-bold text-gray-800">{totalBookings}</h2>
                <p className="text-gray-600">Total Bookings</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a href="/admin/events/new" className="p-4 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors text-center">
              <div className="p-3 bg-blue-200 rounded-full inline-flex mb-2">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <h3 className="font-semibold text-blue-800">Add New Event</h3>
              <p className="text-sm text-blue-600">Create a new event</p>
            </a>

            <a href="/admin/events" className="p-4 bg-green-100 rounded-lg hover:bg-green-200 transition-colors text-center">
              <div className="p-3 bg-green-200 rounded-full inline-flex mb-2">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <h3 className="font-semibold text-green-800">Manage Events</h3>
              <p className="text-sm text-green-600">Edit existing events</p>
            </a>

            <a href="/admin/users" className="p-4 bg-purple-100 rounded-lg hover:bg-purple-200 transition-colors text-center">
              <div className="p-3 bg-purple-200 rounded-full inline-flex mb-2">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-purple-800">View Users</h3>
              <p className="text-sm text-purple-600">See all registered users</p>
            </a>
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Upcoming Events</h2>
            <a href="/admin/events" className="text-blue-600 hover:text-blue-800 text-sm">
              View All Events →
            </a>
          </div>
          {upcomingEventsList.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Available Seats</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {upcomingEventsList.map((event: any) => (
                    <tr key={String(event._id)}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{event.title}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(event.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {event.location}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {event.availableSeats} / {event.totalSeats}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <a href={`/admin/events/${String(event._id)}/edit`} className="text-blue-600 hover:text-blue-900 mr-3">
                          Edit
                        </a>
                        <a href={`/admin/events/${String(event._id)}/bookings`} className="text-green-600 hover:text-green-900">
                          View Bookings
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500">No upcoming events</p>
          )}
        </div>
      </div>
    </div>
  );
}
