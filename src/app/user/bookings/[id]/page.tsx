'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getBookingById } from '@/actions/bookingActions';
import type { IBooking } from '@/models/Booking';
import type { IEvent } from '@/models/Event';

type BookingWithEvent = IBooking & { eventId: IEvent };

export default function BookingDetailsPage() {
  const params = useParams();
  const bookingId = params?.id as string;

  const [booking, setBooking] = useState<BookingWithEvent | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBooking() {
      const res = await getBookingById(bookingId);
      if (res.success && res.booking) {
        // ✅ Safe cast via unknown to satisfy TypeScript
        setBooking(res.booking as unknown as BookingWithEvent);
      } else {
        setError(res.error || 'Failed to load booking');
      }
    }
    if (bookingId) fetchBooking();
  }, [bookingId]);

  if (error) return <div className="p-4 text-red-500">{error}</div>;
  if (!booking) return <div className="p-4">Loading...</div>;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Booking Details</h1>

      <div className="bg-white shadow rounded p-4">
        <p><strong>Booking Code:</strong> {booking.bookingCode}</p>
        <p><strong>Tickets:</strong> {booking.tickets}</p>
        <p><strong>Total Price:</strong> ₹{booking.totalPrice}</p>
        <p><strong>Status:</strong> {booking.status}</p>

        <h2 className="text-xl font-semibold mt-4">Event Info</h2>
        <p><strong>Title:</strong> {booking.eventId?.title}</p>
        <p><strong>Date:</strong> {new Date(booking.eventId?.date).toLocaleString()}</p>
        <p><strong>Location:</strong> {booking.eventId?.location}</p>
        <p><strong>Description:</strong> {booking.eventId?.description}</p>
      </div>
    </div>
  );
}
