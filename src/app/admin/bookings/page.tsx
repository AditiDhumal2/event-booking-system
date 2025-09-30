'use client';

import { useEffect, useState } from 'react';
import { getAllBookings, cancelBooking } from '@/actions/bookingActions';

interface Booking {
  _id: string;
  bookingCode: string;
  tickets: number;
  totalPrice: number;
  status: 'confirmed' | 'cancelled' | 'pending';
  createdAt: string;
  user: {
    _id: string;
    name: string;
    email: string;
  };
  event: {
    _id: string;
    title: string;
    date: string;
    location: string;
  };
}

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadBookings() {
      try {
        const result = await getAllBookings();
        if (!result.success) {
          setError(result.error || 'Failed to fetch bookings');
        } else {
          setBookings(result.bookings || []);
        }
      } catch (err) {
        setError('Something went wrong while fetching bookings');
      } finally {
        setLoading(false);
      }
    }

    loadBookings();
  }, []);

  const handleCancel = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    try {
      const result = await cancelBooking(bookingId);
      if (result.success) {
        // Update the local state to reflect the cancellation
        setBookings(prev => 
          prev.map(booking => 
            booking._id === bookingId 
              ? { ...booking, status: 'cancelled' as const }
              : booking
          )
        );
      } else {
        alert(result.error || 'Failed to cancel booking');
      }
    } catch (err) {
      alert('Failed to cancel booking');
    }
  };

  // Calculate statistics
  const totalBookings = bookings.length;
  const confirmedBookings = bookings.filter(b => b.status === 'confirmed').length;
  const cancelledBookings = bookings.filter(b => b.status === 'cancelled').length;
  const totalRevenue = bookings
    .filter(b => b.status === 'confirmed')
    .reduce((sum, booking) => sum + booking.totalPrice, 0);

  if (loading) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">All Bookings</h1>
          <p className="text-gray-600">Manage all user bookings across events</p>
        </div>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">All Bookings</h1>
          <p className="text-gray-600">Manage all user bookings across events</p>
        </div>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <h2 className="font-bold">Error</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">All Bookings</h1>
          <p className="text-gray-600">Manage all user bookings across events</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-600 text-lg">No bookings found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">All Bookings</h1>
        <p className="text-gray-600">Manage all user bookings across events</p>
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

      {/* Bookings Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Booking Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Event
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tickets & Price
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
                  {/* Booking Details */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {booking.bookingCode}
                    </div>
                    <div className="text-sm text-gray-500">
                      ID: {booking._id.substring(0, 8)}...
                    </div>
                  </td>

                  {/* User Information */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {booking.user.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {booking.user.email}
                    </div>
                    <div className="text-xs text-gray-400">
                      User ID: {booking.user._id.substring(0, 8)}...
                    </div>
                  </td>

                  {/* Event Information */}
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {booking.event.title}
                    </div>
                    <div className="text-sm text-gray-500">
                      {booking.event.location}
                    </div>
                    <div className="text-xs text-gray-400">
                      {new Date(booking.event.date).toLocaleDateString()}
                    </div>
                  </td>

                  {/* Tickets & Price */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {booking.tickets} ticket{booking.tickets !== 1 ? 's' : ''}
                    </div>
                    <div className="text-sm font-semibold text-green-600">
                      ₹{booking.totalPrice.toLocaleString('en-IN')}
                    </div>
                  </td>

                  {/* Status */}
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

                  {/* Booked On */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(booking.createdAt).toLocaleDateString()}
                    <div className="text-xs text-gray-400">
                      {new Date(booking.createdAt).toLocaleTimeString()}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {booking.status === 'confirmed' && (
                      <button
                        onClick={() => handleCancel(booking._id)}
                        className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors"
                      >
                        Cancel Booking
                      </button>
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

      {/* Summary */}
      <div className="mt-4 text-sm text-gray-500">
        Showing {bookings.length} booking{bookings.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
}