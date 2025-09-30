import { getEventBookings, cancelBooking } from '@/actions/bookingActions';
import { getEventById } from '@/actions/eventActions';
import Link from 'next/link';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

interface Booking {
  _id: string;
  bookingCode: string;
  tickets: number;
  totalPrice: number;
  status: 'confirmed' | 'cancelled' | 'pending';
  createdAt: string;
  userId: {
    name: string;
    email: string;
  };
}

export default async function EventBookingsPage({ params }: PageProps) {
  const { id } = await params;

  // Get event details
  const eventResult = await getEventById(id);
  if (!eventResult.success || !eventResult.event) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-bold text-red-600">Event not found</h1>
        <Link href="/admin/events" className="text-blue-600 hover:text-blue-800 mt-4 inline-block">
          ← Back to Events
        </Link>
      </div>
    );
  }

  const event = eventResult.event;

  // Get bookings for this event
  const result = await getEventBookings(id);

  if (!result.success) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-bold text-red-600">
          Failed to fetch bookings
        </h1>
        <p>{result.error || 'Something went wrong.'}</p>
        <Link href="/admin/events" className="text-blue-600 hover:text-blue-800 mt-4 inline-block">
          ← Back to Events
        </Link>
      </div>
    );
  }

  const bookings: Booking[] = (result.bookings || []).map((b: any) => ({
    _id: b._id.toString(),
    bookingCode: b.bookingCode,
    tickets: b.tickets,
    totalPrice: b.totalPrice,
    status: b.status,
    createdAt: b.createdAt,
    userId: {
      name: b.userId?.name || 'Unknown User',
      email: b.userId?.email || '',
    },
  }));

  // Calculate statistics for this event
  const totalBookings = bookings.length;
  const confirmedBookings = bookings.filter(b => b.status === 'confirmed').length;
  const cancelledBookings = bookings.filter(b => b.status === 'cancelled').length;
  const totalRevenue = bookings
    .filter(b => b.status === 'confirmed')
    .reduce((sum, booking) => sum + booking.totalPrice, 0);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <Link 
          href={`/admin/events/${event._id}`}
          className="text-blue-600 hover:text-blue-800 mb-4 inline-block"
        >
          ← Back to Event
        </Link>
        
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Bookings for {event.title}</h1>
            <p className="text-gray-600">{event.location} • {new Date(event.date).toLocaleDateString()}</p>
          </div>
          <Link
            href="/admin/bookings"
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition-colors"
          >
            View All Bookings
          </Link>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-blue-500">
          <h3 className="text-sm font-medium text-gray-500">Total Bookings</h3>
          <p className="text-2xl font-bold text-gray-800">{totalBookings}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-green-500">
          <h3 className="text-sm font-medium text-gray-500">Confirmed</h3>
          <p className="text-2xl font-bold text-green-600">{confirmedBookings}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-red-500">
          <h3 className="text-sm font-medium text-gray-500">Cancelled</h3>
          <p className="text-2xl font-bold text-red-600">{cancelledBookings}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-purple-500">
          <h3 className="text-sm font-medium text-gray-500">Total Revenue</h3>
          <p className="text-2xl font-bold text-purple-600">₹{totalRevenue.toLocaleString('en-IN')}</p>
        </div>
      </div>

      {bookings.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-600 text-lg">No bookings found for this event.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Booking Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tickets
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Booked On
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {bookings.map((booking) => (
                  <tr key={booking._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {booking.bookingCode}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {booking.userId.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {booking.userId.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {booking.tickets}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                      ₹{booking.totalPrice.toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        booking.status === 'confirmed' 
                          ? 'bg-green-100 text-green-800' 
                          : booking.status === 'cancelled'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(booking.createdAt).toLocaleDateString()}
                      <div className="text-xs text-gray-400">
                        {new Date(booking.createdAt).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {booking.status === 'confirmed' && (
                        <form action={async () => {
                          'use server';
                          await cancelBooking(booking._id);
                        }}>
                          <button
                            type="submit"
                            className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors"
                          >
                            Cancel
                          </button>
                        </form>
                      )}
                      {booking.status === 'cancelled' && (
                        <span className="text-gray-400 text-sm">Cancelled</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="mt-4 text-sm text-gray-500">
        Showing {bookings.length} booking{bookings.length !== 1 ? 's' : ''} for this event
      </div>
    </div>
  );
}