// app/user/bookings/page.tsx
import { redirect } from 'next/navigation';
import { getToken } from '@/actions/authActions';
import { getCurrentUser } from '@/lib/auth';
import { getUserBookings, cancelBooking } from '@/actions/bookingActions';
import Link from 'next/link';
import Image from 'next/image';

// Create a separate client component for the searchParams part
function BookingsContent({ 
  bookingSuccess, 
  bookingsResult 
}: { 
  bookingSuccess: boolean;
  bookingsResult: any;
}) {
  const getBookingData = (booking: any) => {
    // If booking is already sanitized (plain object), use it directly
    if (booking && !booking.toObject) {
      return {
        _id: booking._id?.toString() || '',
        bookingCode: booking.bookingCode || '',
        tickets: booking.tickets || 0,
        totalPrice: booking.totalPrice || 0,
        status: booking.status || 'pending',
        createdAt: booking.createdAt ? new Date(booking.createdAt) : new Date(),
        event: {
          _id: booking.event?._id?.toString() || '',
          title: booking.event?.title || 'Unknown Event',
          date: booking.event?.date ? new Date(booking.event.date) : new Date(),
          location: booking.event?.location || 'Unknown Location',
          price: booking.event?.price || 0,
          description: booking.event?.description || '',
          image: booking.event?.image || ''
        }
      };
    }

    // If it's a MongoDB document, convert to plain object
    const plainBooking = booking.toObject ? booking.toObject() : booking;

    return {
      _id: plainBooking._id?.toString() || '',
      bookingCode: plainBooking.bookingCode || '',
      tickets: plainBooking.tickets || 0,
      totalPrice: plainBooking.totalPrice || 0,
      status: plainBooking.status || 'pending',
      createdAt: plainBooking.createdAt ? new Date(plainBooking.createdAt) : new Date(),
      event: {
        _id: plainBooking.event?._id?.toString() || plainBooking.eventId?.toString() || '',
        title: plainBooking.event?.title || 'Unknown Event',
        date: plainBooking.event?.date ? new Date(plainBooking.event.date) : new Date(),
        location: plainBooking.event?.location || 'Unknown Location',
        price: plainBooking.event?.price || 0,
        description: plainBooking.event?.description || '',
        image: plainBooking.event?.image || ''
      }
    };
  };

  // Fixed grouping function
  const groupBookingsByEvent = (bookings: any[]) => {
    const grouped: { [key: string]: any } = {};
    
    bookings.forEach((booking) => {
      const bookingData = getBookingData(booking);
      const eventId = bookingData.event._id;
      
      if (!grouped[eventId]) {
        grouped[eventId] = {
          event: bookingData.event,
          bookings: [],
          totalTickets: 0,
          totalAmount: 0,
          status: 'confirmed'
        };
      }
      
      grouped[eventId].bookings.push(bookingData);
      grouped[eventId].totalTickets += bookingData.tickets;
      grouped[eventId].totalAmount += bookingData.totalPrice;
    });

    // Calculate status AFTER processing all bookings
    Object.values(grouped).forEach((group: any) => {
      const confirmedCount = group.bookings.filter((b: any) => b.status === 'confirmed').length;
      const cancelledCount = group.bookings.filter((b: any) => b.status === 'cancelled').length;
      const totalCount = group.bookings.length;

      if (cancelledCount === totalCount) {
        // All bookings are cancelled
        group.status = 'cancelled';
      } else if (cancelledCount > 0 && cancelledCount < totalCount) {
        // Some bookings are cancelled, some are confirmed
        group.status = 'partially-cancelled';
      } else {
        // All bookings are confirmed
        group.status = 'confirmed';
      }
    });
    
    return Object.values(grouped);
  };

  const groupedBookings = bookingsResult.success && bookingsResult.bookings 
    ? groupBookingsByEvent(bookingsResult.bookings)
    : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">My Bookings</h1>
            <p className="text-gray-600 mt-2">Manage your event bookings and reservations</p>
          </div>
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
          {groupedBookings.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {groupedBookings.map((group: any, index: number) => {
                const event = group.event;
                const hasMultipleBookings = group.bookings.length > 1;
                
                return (
                  <div key={`${event._id}-${index}`} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                      {/* Event Details */}
                      <div className="flex-1 flex items-start space-x-4">
                        {/* Event Image */}
                        <div className="flex-shrink-0">
                          {event.image ? (
                            <Image 
                              src={event.image} 
                              alt={event.title}
                              width={80}
                              height={80}
                              className="w-20 h-20 object-cover rounded-lg"
                            />
                          ) : (
                            <div className="w-20 h-20 bg-blue-100 rounded-lg flex items-center justify-center">
                              <span className="text-2xl">🎫</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Event Information */}
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold text-gray-800 mb-2">{event.title}</h3>
                          
                          {/* Event Details Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm text-gray-600">
                            <div className="flex items-center">
                              <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <span>{event.date.toLocaleDateString()}</span>
                            </div>
                            
                            <div className="flex items-center">
                              <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span>{event.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            
                            <div className="flex items-center">
                              <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              <span className="truncate">{event.location}</span>
                            </div>
                          </div>
                          
                          {/* Event Description (if available) */}
                          {event.description && (
                            <p className="text-gray-600 text-sm mt-2 line-clamp-2">
                              {event.description}
                            </p>
                          )}
                          
                          {/* Multiple Bookings Info */}
                          {hasMultipleBookings && (
                            <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                              <div className="flex items-center text-sm text-blue-800">
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="font-medium">
                                  You have {group.bookings.length} booking{group.bookings.length > 1 ? 's' : ''} for this event
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Booking Details & Actions */}
                      <div className="lg:text-right space-y-3">
                        {/* Status Badge */}
                        <div className={`px-3 py-1 rounded-full text-sm font-medium inline-block ${
                          group.status === 'confirmed' 
                            ? 'bg-green-100 text-green-800'
                            : group.status === 'partially-cancelled'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {group.status === 'partially-cancelled' ? 'Partially Cancelled' : 
                           group.status.charAt(0).toUpperCase() + group.status.slice(1)}
                        </div>
                        
                        {/* Total Price */}
                        <div className="text-lg font-bold text-gray-800">
                          ₹{group.totalAmount.toLocaleString('en-IN')}
                        </div>
                        
                        {/* Total Tickets */}
                        <div className="text-sm text-gray-600">
                          {group.totalTickets} ticket{group.totalTickets !== 1 ? 's' : ''} total
                        </div>
                        
                        {/* Cancel Buttons */}
                        {group.bookings.some((b: any) => b.status === 'confirmed') && (
                          <div className="space-y-2">
                            {hasMultipleBookings ? (
                              <div className="space-y-1">
                                {group.bookings.map((booking: any) => (
                                  booking.status === 'confirmed' && (
                                    <form key={booking._id} action={async () => {
                                      'use server';
                                      await cancelBooking(booking._id);
                                    }} className="flex items-center justify-end space-x-2">
                                      <span className="text-xs text-gray-500">
                                        {booking.tickets} ticket{booking.tickets !== 1 ? 's' : ''}
                                      </span>
                                      <button 
                                        type="submit" 
                                        className="text-red-600 hover:text-red-800 text-sm font-medium transition-colors px-2 py-1 border border-red-200 rounded-md hover:bg-red-50"
                                      >
                                        Cancel
                                      </button>
                                    </form>
                                  )
                                ))}
                              </div>
                            ) : (
                              <form action={async () => {
                                'use server';
                                await cancelBooking(group.bookings[0]._id);
                              }}>
                                <button 
                                  type="submit" 
                                  className="text-red-600 hover:text-red-800 text-sm font-medium transition-colors px-3 py-1 border border-red-200 rounded-md hover:bg-red-50"
                                >
                                  Cancel Booking
                                </button>
                              </form>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Booking Metadata */}
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      {/* Individual Booking Details (only show if multiple bookings) */}
                      {hasMultipleBookings && (
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Booking Details:</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {group.bookings.map((booking: any) => (
                              <div key={booking._id} className={`p-3 rounded-lg border ${
                                booking.status === 'confirmed' 
                                  ? 'bg-green-50 border-green-200' 
                                  : 'bg-red-50 border-red-200'
                              }`}>
                                <div className="flex justify-between items-center text-sm">
                                  <div>
                                    <div className="font-medium">{booking.bookingCode}</div>
                                    <div className="text-gray-600">
                                      {booking.tickets} ticket{booking.tickets !== 1 ? 's' : ''}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {new Date(booking.createdAt).toLocaleDateString()}
                                    </div>
                                  </div>
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    booking.status === 'confirmed' 
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-red-100 text-red-800'
                                  }`}>
                                    {booking.status}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Summary Information */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          <span>{hasMultipleBookings ? `${group.bookings.length} booking IDs` : `Booking ID: ${group.bookings[0].bookingCode}`}</span>
                        </div>
                        <div className="flex items-center">
                          <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>First booked: {new Date(group.bookings[0].createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center">
                          <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>Overall: {group.status}</span>
                        </div>
                      </div>
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

// Main page component - properly handles searchParams
export default async function UserBookingsPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ booking?: string }> 
}) {
  const token = await getToken();
  if (!token) {
    redirect('/auth/login');
  }

  const userDoc = await getCurrentUser(token);
  if (!userDoc) {
    redirect('/auth/login');
  }

  // Properly await searchParams
  const resolvedSearchParams = await searchParams;
  const bookingSuccess = resolvedSearchParams?.booking === 'success';
  
  const bookingsResult = await getUserBookings();

  return (
    <BookingsContent 
      bookingSuccess={bookingSuccess} 
      bookingsResult={bookingsResult} 
    />
  );
}