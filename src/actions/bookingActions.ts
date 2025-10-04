'use server';

import { revalidatePath } from 'next/cache';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongoose';
import { requireAuth } from '@/lib/auth';
import { toPlainObject, toPlainArray, sanitizeMongoData } from '@/lib/mongoUtils';

// Helper function to generate booking code
function generateBookingCode(): string {
  return 'BK' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();
}

// ========================
// Model Import Functions
// ========================
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
// Check if user already booked an event
// ========================
export async function checkUserBooking(eventId: string) {
  try {
    const user = await requireAuth();
    const Booking = await getBookingModel();

    const existingBooking = await Booking.findOne({
      userId: user._id,
      eventId: new mongoose.Types.ObjectId(eventId),
      status: 'confirmed'
    });

    return { 
      success: true, 
      alreadyBooked: !!existingBooking,
      booking: existingBooking ? toPlainObject(existingBooking) : null
    };
  } catch (err: any) {
    console.error('Check booking error:', err);
    return { 
      success: false, 
      error: err.message || 'Failed to check booking status',
      alreadyBooked: false 
    };
  }
}

// ========================
// Create a booking (with payment support)
// ========================
export async function createBooking(eventId: string, formData: FormData) {
  try {
    const user = await requireAuth();
    const Booking = await getBookingModel();
    const Event = await getEventModel();

    // Parse tickets from form data
    const tickets = parseInt(formData.get('tickets') as string, 10) || 1;
    const paymentId = formData.get('paymentId') as string;
    const orderId = formData.get('orderId') as string;

    const event = await Event.findById(eventId);
    if (!event) return { success: false, error: 'Event not found' };

    if (event.availableSeats < tickets)
      return { success: false, error: 'Not enough seats available' };

    // ✅ CHECK IF USER ALREADY BOOKED THIS EVENT
    const existingBooking = await Booking.findOne({
      userId: user._id,
      eventId: event._id,
      status: 'confirmed' // Only check confirmed bookings
    });

    if (existingBooking) {
      return { 
        success: false, 
        error: 'You have already booked tickets for this event. You cannot book multiple times for the same event.' 
      };
    }

    // Create booking with payment info
    const booking = await Booking.create({
      userId: user._id,
      eventId: event._id,
      tickets,
      totalPrice: tickets * event.price,
      bookingCode: generateBookingCode(),
      status: 'confirmed',
      paymentId: paymentId || undefined,
      orderId: orderId || undefined,
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
    
    // Handle duplicate booking error from MongoDB unique index
    if (err.code === 11000) {
      return { 
        success: false, 
        error: 'You have already booked tickets for this event. You cannot book multiple times for the same event.' 
      };
    }
    
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
// Get all bookings of current user - FIXED VERSION
// ========================
export async function getUserBookings() {
  const user = await requireAuth();
  const Booking = await getBookingModel();
  const Event = await getEventModel();

  try {
    // Use aggregation to get bookings with event information
    const bookings = await Booking.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(user._id) } },
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
          paymentId: 1,
          orderId: 1,
          createdAt: 1,
          'event._id': 1,
          'event.title': 1,
          'event.date': 1,
          'event.location': 1,
          'event.price': 1,
          'event.description': 1,
          'event.image': 1
        }
      },
      { $sort: { createdAt: -1 } }
    ]);

    // If aggregation returns empty, try the populate method
    let finalBookings = bookings;
    if (bookings.length === 0) {
      console.log('Trying populate method for user bookings...');
      const populatedBookings = await Booking.find({ userId: user._id })
        .populate('eventId')
        .sort({ createdAt: -1 })
        .lean();
      
      finalBookings = populatedBookings;
    }

    // Transform the data to consistent format
    const transformedBookings = finalBookings.map((booking: any) => {
      // Handle event data from different sources
      let eventData = {
        _id: '',
        title: 'Unknown Event',
        date: new Date(),
        location: 'Unknown Location',
        price: 0,
        description: '',
        image: ''
      };

      if (booking.event) {
        // From aggregation
        eventData = {
          _id: booking.event._id?.toString() || '',
          title: booking.event.title || 'Unknown Event',
          date: booking.event.date ? new Date(booking.event.date) : new Date(),
          location: booking.event.location || 'Unknown Location',
          price: booking.event.price || 0,
          description: booking.event.description || '',
          image: booking.event.image || ''
        };
      } else if (booking.eventId && typeof booking.eventId === 'object') {
        // From populate method
        eventData = {
          _id: booking.eventId._id?.toString() || '',
          title: booking.eventId.title || 'Unknown Event',
          date: booking.eventId.date ? new Date(booking.eventId.date) : new Date(),
          location: booking.eventId.location || 'Unknown Location',
          price: booking.eventId.price || 0,
          description: booking.eventId.description || '',
          image: booking.eventId.image || ''
        };
      } else if (typeof booking.eventId === 'string') {
        // Only event ID available
        eventData = {
          _id: booking.eventId,
          title: 'Event (Loading...)',
          date: new Date(),
          location: 'Location not available',
          price: 0,
          description: '',
          image: ''
        };
      }

      return {
        _id: booking._id?.toString() || '',
        bookingCode: booking.bookingCode || '',
        tickets: booking.tickets || 0,
        totalPrice: booking.totalPrice || 0,
        status: booking.status || 'confirmed',
        paymentId: booking.paymentId || '',
        orderId: booking.orderId || '',
        createdAt: booking.createdAt ? new Date(booking.createdAt).toISOString() : new Date().toISOString(),
        event: eventData
      };
    });

    console.log(`✅ Fetched ${transformedBookings.length} bookings for user ${user._id}`);
    
    return { 
      success: true, 
      bookings: transformedBookings 
    };
  } catch (err: any) {
    console.error('User bookings fetch error:', err);
    return { 
      success: false, 
      error: err.message || 'Failed to fetch bookings' 
    };
  }
}

// ========================
// Get all bookings for a specific event (admin only) - FIXED VERSION
// ========================
export async function getEventBookings(eventId: string) {
  const user = await requireAuth();
  if (user.role !== 'admin')
    return { success: false, error: 'Not authorized' };
  
  const Booking = await getBookingModel();
  const User = await getUserModel();

  try {
    console.log('Fetching bookings for event:', eventId);

    // Method 1: Using aggregation (more reliable)
    const bookings = await Booking.aggregate([
      { $match: { eventId: new mongoose.Types.ObjectId(eventId) } },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: {
          path: '$user',
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
          paymentId: 1,
          orderId: 1,
          createdAt: 1,
          'user._id': 1,
          'user.name': 1,
          'user.email': 1
        }
      },
      { $sort: { createdAt: -1 } }
    ]);

    console.log('Aggregation result count:', bookings.length);

    // If aggregation returns empty, try the populate method
    let finalBookings = bookings;
    if (bookings.length === 0) {
      console.log('Trying populate method...');
      const populatedBookings = await Booking.find({ eventId })
        .populate('userId', 'name email')
        .sort({ createdAt: -1 })
        .lean();
      
      finalBookings = populatedBookings;
      console.log('Populate method result count:', populatedBookings.length);
    }

    // If still no data, try manual population
    if (finalBookings.length === 0) {
      console.log('Trying manual population...');
      const rawBookings = await Booking.find({ eventId }).sort({ createdAt: -1 }).lean();
      
      finalBookings = await Promise.all(
        rawBookings.map(async (booking: any) => {
          try {
            const user = await User.findById(booking.userId).select('name email').lean();
            return {
              ...booking,
              user: user || { name: 'Unknown User', email: 'No email available' }
            };
          } catch (userError) {
            console.error('Error fetching user for booking:', booking._id, userError);
            return {
              ...booking,
              user: { name: 'Error Loading User', email: 'Error' }
            };
          }
        })
      );
    }

    // Transform the data to consistent format
    const transformedBookings = finalBookings.map((booking: any) => {
      // Handle different data structures
      let userName = 'Unknown User';
      let userEmail = '';

      if (booking.user) {
        // From aggregation or manual population
        userName = booking.user.name || 'Unknown User';
        userEmail = booking.user.email || '';
      } else if (booking.userId && typeof booking.userId === 'object') {
        // From populate method
        userName = booking.userId.name || 'Unknown User';
        userEmail = booking.userId.email || '';
      } else if (typeof booking.userId === 'string') {
        // Only user ID available
        userName = `User (${booking.userId})`;
        userEmail = 'Not available';
      }

      return {
        _id: booking._id?.toString() || '',
        bookingCode: booking.bookingCode || '',
        tickets: booking.tickets || 0,
        totalPrice: booking.totalPrice || 0,
        status: booking.status || 'confirmed',
        paymentId: booking.paymentId || '',
        orderId: booking.orderId || '',
        createdAt: booking.createdAt ? new Date(booking.createdAt).toISOString() : new Date().toISOString(),
        userId: {
          name: userName,
          email: userEmail,
        }
      };
    });

    console.log('Final transformed bookings:', transformedBookings.length);
    
    return { 
      success: true, 
      bookings: transformedBookings 
    };
  } catch (err: any) {
    console.error('Event bookings fetch error:', err);
    return { 
      success: false, 
      error: err.message || 'Failed to fetch event bookings' 
    };
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
          paymentId: 1,
          orderId: 1,
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
      paymentId: booking.paymentId || '',
      orderId: booking.orderId || '',
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