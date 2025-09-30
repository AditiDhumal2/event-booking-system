'use server';

import { revalidatePath } from 'next/cache';
import dbConnect from '@/lib/mongoose';
import { requireAuth } from '@/lib/auth';
import { generateBookingCode } from '@/lib/utils';
import { sanitizeMongoData, toPlainObject, toPlainArray } from '@/lib/mongoUtils';

// Import models inside the functions to ensure they're registered after connection
async function getBookingModel() {
  await dbConnect();
  try {
    const { Booking } = await import('@/models/Booking');
    return Booking;
  } catch (error) {
    console.error('Error importing Booking model:', error);
    throw new Error('Failed to load Booking model');
  }
}

async function getEventModel() {
  await dbConnect();
  try {
    const { Event } = await import('@/models/Event');
    return Event;
  } catch (error) {
    console.error('Error importing Event model:', error);
    throw new Error('Failed to load Event model');
  }
}

async function getUserModel() {
  await dbConnect();
  try {
    const { User } = await import('@/models/User');
    return User;
  } catch (error) {
    console.error('Error importing User model:', error);
    throw new Error('Failed to load User model');
  }
}

// ========================
// Create a booking (server action for form submission)
// ========================
export async function createBooking(eventId: string, formData: FormData) {
  try {
    const user = await requireAuth();
    const Booking = await getBookingModel();
    const Event = await getEventModel();

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

    // Sanitize the booking object before returning
    const sanitizedBooking = toPlainObject(booking);

    // Revalidate pages
    revalidatePath('/user/bookings');
    revalidatePath(`/events/${eventId}`);
    revalidatePath('/user/home');

    return { success: true, booking: sanitizedBooking };
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
  const Booking = await getBookingModel();
  const Event = await getEventModel();

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
    if (hoursUntilEvent < 24 && user.role !== 'admin')
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
    revalidatePath('/admin/bookings');
    revalidatePath('/user/home');

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
  const Booking = await getBookingModel();
  const Event = await getEventModel();

  try {
    const bookings = await Booking.find({ userId: user._id })
      .populate('eventId')
      .sort({ createdAt: -1 });

    // Sanitize all bookings before returning
    const sanitizedBookings = toPlainArray(bookings);

    return { success: true, bookings: sanitizedBookings };
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
  
  const Booking = await getBookingModel();
  const User = await getUserModel();

  try {
    const bookings = await Booking.find({ eventId })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });

    // Sanitize all bookings before returning
    const sanitizedBookings = toPlainArray(bookings);

    return { success: true, bookings: sanitizedBookings };
  } catch (err: any) {
    console.error('Event bookings fetch error:', err);
    return { success: false, error: err.message || 'Failed to fetch event bookings' };
  }
}

// ========================
// Get ALL bookings across all events (admin only)
// ========================
export async function getAllBookings(): Promise<{ success: boolean; bookings?: any[]; error?: string }> {
  const user = await requireAuth();
  if (user.role !== 'admin') {
    return { success: false, error: 'Not authorized' };
  }

  const Booking = await getBookingModel();
  const Event = await getEventModel();
  const User = await getUserModel();

  try {
    // Use aggregation to get all bookings with user and event information
    const bookings = await Booking.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $lookup: {
          from: 'events',
          localField: 'eventId',
          foreignField: '_id',
          as: 'event'
        }
      },
      {
        $unwind: {
          path: '$user',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $unwind: {
          path: '$event',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          _id: 1,
          bookingCode: 1,
          tickets: 1,
          totalPrice: 1,
          status: 1,
          createdAt: 1,
          'user._id': 1,
          'user.name': 1,
          'user.email': 1,
          'event._id': 1,
          'event.title': 1,
          'event.date': 1,
          'event.location': 1,
          'event.price': 1
        }
      },
      { $sort: { createdAt: -1 } } // Latest bookings first
    ]);

    if (!bookings || bookings.length === 0) {
      return { success: true, bookings: [] };
    }

    // Convert to plain objects and sanitize
    const plainBookings = bookings.map((booking: any) => sanitizeMongoData({
      _id: booking._id?.toString() || '',
      bookingCode: booking.bookingCode || '',
      tickets: booking.tickets || 0,
      totalPrice: booking.totalPrice || 0,
      status: booking.status || 'pending',
      createdAt: booking.createdAt ? new Date(booking.createdAt).toISOString() : new Date().toISOString(),
      user: {
        _id: booking.user?._id?.toString() || '',
        name: booking.user?.name || 'Unknown User',
        email: booking.user?.email || ''
      },
      event: {
        _id: booking.event?._id?.toString() || '',
        title: booking.event?.title || 'Unknown Event',
        date: booking.event?.date ? new Date(booking.event.date).toISOString() : '',
        location: booking.event?.location || '',
        price: booking.event?.price || 0
      }
    }));

    console.log(`✅ Fetched ${plainBookings.length} total bookings`);
    return { success: true, bookings: plainBookings };
  } catch (error) {
    console.error('❌ Get all bookings error:', error);
    return { success: false, error: 'Failed to fetch all bookings' };
  }
}

// ========================
// Get single booking by ID
// ========================
export async function getBookingById(bookingId: string) {
  const user = await requireAuth();
  const Booking = await getBookingModel();
  const Event = await getEventModel();
  const User = await getUserModel();

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

    // Sanitize the booking before returning
    const sanitizedBooking = toPlainObject(booking);

    return { success: true, booking: sanitizedBooking };
  } catch (err: any) {
    console.error('Get booking by ID error:', err);
    return { success: false, error: err.message || 'Failed to fetch booking' };
  }
}

// ========================
// Get booking statistics (admin only)
// ========================
export async function getBookingStats() {
  const user = await requireAuth();
  if (user.role !== 'admin') {
    return { success: false, error: 'Not authorized' };
  }

  const Booking = await getBookingModel();

  try {
    const stats = await Booking.aggregate([
      {
        $group: {
          _id: null,
          totalBookings: { $sum: 1 },
          totalRevenue: { $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, '$totalPrice', 0] } },
          confirmedBookings: { $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] } },
          cancelledBookings: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
          pendingBookings: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } }
        }
      }
    ]);

    const result = stats[0] || {
      totalBookings: 0,
      totalRevenue: 0,
      confirmedBookings: 0,
      cancelledBookings: 0,
      pendingBookings: 0
    };

    return { success: true, stats: result };
  } catch (error) {
    console.error('Get booking stats error:', error);
    return { success: false, error: 'Failed to fetch booking statistics' };
  }
}