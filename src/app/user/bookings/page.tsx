// app/user/bookings/page.tsx
import { redirect } from 'next/navigation';
import { getToken } from '@/actions/authActions';
import { getCurrentUser } from '@/lib/auth';
import { getUserBookings, cancelBooking } from '@/actions/bookingActions';
import Link from 'next/link';

interface PageProps {
  searchParams?: { [key: string]: string | string[] | undefined };
}

export default async function UserBookingsPage({ searchParams }: PageProps) {
  const token = await getToken();
  if (!token) {
    redirect('/auth/login');
  }

  const userDoc = await getCurrentUser(token);
  if (!userDoc) {
    redirect('/auth/login');
  }

  const bookingSuccess = searchParams?.booking === 'success';
  const bookingsResult = await getUserBookings();

  const getBookingData = (booking: any) => {
    const plainBooking = booking.toObject ? booking.toObject() : booking;

    return {
      _id: plainBooking._id?.toString() || '',
      userId: plainBooking.userId?.toString() || '',
      eventId: {
        _id: plainBooking.eventId?._id?.toString() || '',
        title: plainBooking.eventId?.title || 'Unknown Event',
        date: plainBooking.eventId?.date ? new Date(plainBooking.eventId.date) : new Date(),
        location: plainBooking.eventId?.location || 'Unknown Location',
        price: plainBooking.eventId?.price || 0
      },
      tickets: plainBooking.tickets || 0,
      totalPrice: plainBooking.totalPrice || 0,
      bookingCode: plainBooking.bookingCode || '',
      status: plainBooking.status || 'pending',
      createdAt: plainBooking.createdAt ? new Date(plainBooking.createdAt) : new Date(),
      updatedAt: plainBooking.updatedAt ? new Date(plainBooking.updatedAt) : new Date()
    };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">My Bookings</h1>
            <p className="text-gray-600 mt-2">Manage your event bookings and reservations</p>
          </div>
          <Link
            href="/user"
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Events
          </Link>
        </div>

        {/* Success Message */}
        {bookingSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-green-800 font-medium">Booking confirmed successfully!</span>
            </div>
          </div>
        )}

        {/* Bookings List */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {bookingsResult.success && bookingsResult.bookings && bookingsResult.bookings.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {bookingsResult.bookings.map((booking: any) => {
                const bookingData = getBookingData(booking);
                return (
                  <div key={bookingData._id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 flex items-center space-x-4">
                        <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center">
                          <span className="text-2xl">🎫</span>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold text-gray-800">{bookingData.eventId.title}</h3>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2 text-sm text-gray-600">
                            <div><span className="font-medium">Date:</span> {bookingData.eventId.date.toLocaleDateString()}</div>
                            <div><span className="font-medium">Time:</span> {bookingData.eventId.date.toLocaleTimeString()}</div>
                            <div><span className="font-medium">Tickets:</span> {bookingData.tickets}</div>
                            <div><span className="font-medium">Location:</span> {bookingData.eventId.location}</div>
                          </div>
                        </div>
                      </div>

                      <div className="text-right space-y-2">
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                          bookingData.status === 'confirmed' 
                            ? 'bg-green-100 text-green-800'
                            : bookingData.status === 'cancelled'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {bookingData.status.charAt(0).toUpperCase() + bookingData.status.slice(1)}
                        </div>
                        <div className="text-lg font-bold text-gray-800">
                          ₹{bookingData.totalPrice.toLocaleString('en-IN')}
                        </div>
                        {bookingData.status === 'confirmed' && (
                          <form action={async () => {
                            'use server';
                            await cancelBooking(bookingData._id);
                          }}>
                            <button type="submit" className="text-red-600 hover:text-red-800 text-sm font-medium transition-colors">
                              Cancel Booking
                            </button>
                          </form>
                        )}
                      </div>
                    </div>

                    {/* Booking Details */}
                    <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div><span className="font-medium">Booking ID:</span> {bookingData.bookingCode}</div>
                      <div><span className="font-medium">Booked on:</span> {bookingData.createdAt.toLocaleDateString()}</div>
                      <div><span className="font-medium">Status:</span> {bookingData.status}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold text-gray-800 mb-3">No Bookings Yet</h3>
              <p className="text-gray-600 max-w-md mx-auto mb-6">
                {bookingsResult.error 
                  ? `Error: ${bookingsResult.error}` 
                  : "You haven't booked any events yet. Explore our events and make your first booking!"
                }
              </p>
              <Link
                href="/user"
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Browse Events
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
