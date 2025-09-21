// src/app/admin/events/[id]/bookings/page.tsx

import { getEventBookings } from '@/actions/bookingActions';
import { notFound } from 'next/navigation';

interface PageProps {
  params: { id: string };
}

export default async function EventBookingsPage({ params }: PageProps) {
  const { id } = params;

  const result = await getEventBookings(id);

  if (!result || result.error) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-bold text-red-600">
          Failed to fetch bookings
        </h1>
        <p>{result?.error || "Something went wrong."}</p>
      </div>
    );
  }

  const { bookings } = result;

  if (!bookings || bookings.length === 0) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold">Event Bookings</h1>
        <p className="text-gray-600">No bookings found for this event.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Event Bookings</h1>

      <table className="w-full border border-gray-300 rounded-lg overflow-hidden">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-4 py-2 border">Booking Code</th>
            <th className="px-4 py-2 border">User</th>
            <th className="px-4 py-2 border">Tickets</th>
            <th className="px-4 py-2 border">Total Price</th>
            <th className="px-4 py-2 border">Status</th>
            <th className="px-4 py-2 border">Booked At</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((booking: any) => (
            <tr key={booking._id} className="text-center">
              <td className="px-4 py-2 border">{booking.bookingCode}</td>
              <td className="px-4 py-2 border">
                {booking.userId?.name} <br />
                <span className="text-sm text-gray-500">{booking.userId?.email}</span>
              </td>
              <td className="px-4 py-2 border">{booking.tickets}</td>
              <td className="px-4 py-2 border">₹{booking.totalPrice}</td>
              <td
                className={`px-4 py-2 border font-semibold ${
                  booking.status === "confirmed"
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {booking.status}
              </td>
              <td className="px-4 py-2 border">
                {new Date(booking.createdAt).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
