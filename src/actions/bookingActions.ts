'use server';

import { revalidatePath } from 'next/cache';
import { Booking } from '@/models/Booking';
import { Event } from '@/models/Event';
import dbConnect from '@/lib/mongoose';
import { requireAuth } from '@/lib/auth';
import { generateBookingCode } from '@/lib/utils';

// ========================
// Create a booking (server action for form submission)
// ========================
export async function createBooking(eventId: string, formData: FormData) {
  try {
    const user = await requireAuth();
    await dbConnect();

    // Parse tickets from form data
    const tickets = parseInt(formData.get('tickets') as string, 10) || 1;

    const event = await Event.findById(eventId);
    if (!event) return { success: false, error: 'Event not found' };

    if (event.availableSeats < tickets)
      return { success: false, error: 'Not enough seats available' };

    // Create booking
    const booking = await Booking.create({
      userId: user._id,
      eventId: event._id,
      tickets,
      totalPrice: tickets * event.price,
      bookingCode: generateBookingCode(),
      status: 'confirmed',
    });

    // Update event available seats
    event.availableSeats -= tickets;
    await event.save();

    // Revalidate pages
    revalidatePath('/user/bookings');
    revalidatePath(`/events/${eventId}`);

    return { success: true, booking };
  } catch (err: any) {
    console.error('Booking error:', err);
    return { success: false, error: err.message || 'Something went wrong' };
  }
}

// ========================
// Cancel a booking (server action for form submission)
// ========================
export async function cancelBooking(bookingId: string) {
  const user = await requireAuth();
  await dbConnect();

  try {
    const booking = await Booking.findById(bookingId).populate('eventId');
    if (!booking) return { success: false, error: 'Booking not found' };

    if (
      booking.userId.toString() !== user._id.toString() &&
      user.role !== 'admin'
    ) {
      return { success: false, error: 'Not authorized' };
    }

    const event = await Event.findById(booking.eventId);
    if (!event) return { success: false, error: 'Event not found' };

    const hoursUntilEvent =
      (event.date.getTime() - new Date().getTime()) / (1000 * 60 * 60);
    if (hoursUntilEvent < 24)
      return {
        success: false,
        error: 'Cancellation not allowed within 24 hours of event',
      };

    booking.status = 'cancelled';
    await booking.save();

    event.availableSeats += booking.tickets;
    await event.save();

    revalidatePath('/user/bookings');
    revalidatePath(`/events/${event._id}`);

    return { success: true, message: 'Booking cancelled successfully' };
  } catch (err: any) {
    console.error('Cancellation error:', err);
    return { success: false, error: err.message || 'Something went wrong' };
  }
}

// ========================
// Get all bookings of current user
// ========================
export async function getUserBookings() {
  const user = await requireAuth();
  await dbConnect();

  try {
    const bookings = await Booking.find({ userId: user._id })
      .populate('eventId')
      .sort({ createdAt: -1 });

    return { success: true, bookings };
  } catch (err: any) {
    console.error('Bookings fetch error:', err);
    return { success: false, error: err.message || 'Failed to fetch bookings' };
  }
}

// ========================
// Get all bookings for a specific event (admin only)
// ========================
export async function getEventBookings(eventId: string) {
  const user = await requireAuth();
  if (user.role !== 'admin')
    return { success: false, error: 'Not authorized' };
  await dbConnect();

  try {
    const bookings = await Booking.find({ eventId })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });

    return { success: true, bookings };
  } catch (err: any) {
    console.error('Event bookings fetch error:', err);
    return { success: false, error: err.message || 'Failed to fetch event bookings' };
  }
}

// ========================
// Get single booking by ID
// ========================
export async function getBookingById(bookingId: string) {
  const user = await requireAuth();
  await dbConnect();

  try {
    const booking = await Booking.findById(bookingId)
      .populate('eventId')
      .populate('userId', 'name email');

    if (!booking) return { success: false, error: 'Booking not found' };

    if (
      booking.userId._id.toString() !== user._id.toString() &&
      user.role !== 'admin'
    ) {
      return { success: false, error: 'Not authorized to view this booking' };
    }

    return { success: true, booking };
  } catch (err: any) {
    console.error('Get booking by ID error:', err);
    return { success: false, error: err.message || 'Failed to fetch booking' };
  }
}
