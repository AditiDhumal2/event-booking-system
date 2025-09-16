import Link from 'next/link';
import { getEventBookings, getEvent } from '@/actions/eventActions';

// Define types
interface Booking {
  _id: string;
  userId: string;
  userName: string;
  userEmail: string;
  tickets: number;
  totalAmount: number;
  status: string;
  createdAt: string;
}

interface Event {
  _id: string;
  title: string;
  date: string;
  location: string;
}

interface PageProps {
  params: {
    id: string;
  };
}

export default async function EventBookingsPage({ params }: PageProps) {
  const { id: eventId } = params;

  // Fetch event details and bookings
  const [eventResult, bookingsResult] = await Promise.all([
    getEvent(eventId),
    getEventBookings(eventId)
  ]);

  if (!eventResult.success) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="p-4 bg-red-100 text-red-700 rounded-md">
          Error: {eventResult.error}
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

  const event = eventResult.event as Event;
  const bookings = bookingsResult.success ? (bookingsResult.bookings as Booking[]) : [];

  // Calculate totals
  const totalBookings = bookings.length;
  const totalTickets = bookings.reduce((sum, booking) => sum + booking.tickets, 0);
  const totalRevenue = bookings.reduce((sum, booking) => sum + booking.totalAmount, 0);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <Link 
          href="/admin/events"
          className="text-blue-600 hover:text-blue-800 mb-4 inline-block"
        >
          ← Back to Events
        </Link>
        
        <h1 className="text-2xl font-bold text-gray-800">Bookings for: {event.title}</h1>
        <div className="mt-2 text-sm text-gray-600">
          <p>Date: {new Date(event.date).toLocaleDateString()}</p>
          <p>Location: {event.location}</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-blue-500">
          <h3 className="text-lg font-semibold text-gray-700">Total Bookings</h3>
          <p className="text-2xl font-bold text-gray-900">{totalBookings}</p>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-green-500">
          <h3 className="text-lg font-semibold text-gray-700">Tickets Sold</h3>
          <p className="text-2xl font-bold text-gray-900">{totalTickets}</p>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-purple-500">
          <h3 className="text-lg font-semibold text-gray-700">Total Revenue</h3>
          <p className="text-2xl font-bold text-gray-900">₹{totalRevenue.toLocaleString('en-IN')}</p>
        </div>
      </div>

      {!bookingsResult.success ? (
        <div className="p-4 bg-red-100 text-red-700 rounded-md">
          Error loading bookings: {bookingsResult.error}
        </div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500 mb-4">No bookings found for this event.</p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tickets
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Booked On
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {bookings.map((booking) => (
                <tr key={booking._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{booking.userName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {booking.userEmail}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {booking.tickets}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ₹{booking.totalAmount.toLocaleString('en-IN')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${booking.status === 'confirmed' ? 'bg-green-100 text-green-800' : 
                        booking.status === 'cancelled' ? 'bg-red-100 text-red-800' : 
                        'bg-yellow-100 text-yellow-800'}`}>
                      {booking.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(booking.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}