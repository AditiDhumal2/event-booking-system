'use server';

import { revalidatePath } from 'next/cache';
import { Booking, IBooking } from '@/models/Booking';
import { Event, IEvent } from '@/models/Event';
import dbConnect from '@/lib/mongoose';
import { requireAuth } from '@/lib/auth';
import { generateBookingCode } from '@/lib/utils';

export async function bookTickets(eventId: string, tickets: number) {
  const user = await requireAuth();
  await dbConnect();
  
  try {
    const event = await Event.findById(eventId);
    if (!event) {
      return { error: 'Event not found' };
    }
    
    if (event.availableSeats < tickets) {
      return { error: 'Not enough seats available' };
    }
    
    // Start transaction
    const session = await Booking.startSession();
    session.startTransaction();
    
    try {
      // Update event seats
      event.availableSeats -= tickets;
      await event.save({ session });
      
      // Create booking
      const totalPrice = event.price * tickets;
      const bookingCode = generateBookingCode();
      
      const booking = new Booking({
        eventId: event._id,
        userId: (user._id as unknown as string).toString(), // Fix: Cast to string
        tickets,
        totalPrice,
        bookingCode
      });
      
      await booking.save({ session });
      
      // Commit transaction
      await session.commitTransaction();
      session.endSession();
      
      revalidatePath('/user/home');
      revalidatePath(`/events/${eventId}`);
      
      return { 
        success: true, 
        booking,
        message: 'Tickets booked successfully!' 
      };
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  } catch (error) {
    console.error('Booking error:', error);
    return { error: 'Booking failed. Please try again.' };
  }
}

export async function cancelBooking(bookingId: string) {
  const user = await requireAuth();
  await dbConnect();
  
  try {
    const booking = await Booking.findById(bookingId).populate('eventId');
    if (!booking) {
      return { error: 'Booking not found' };
    }
    
    // Check if user owns the booking or is admin
    if (booking.userId.toString() !== (user._id as unknown as string).toString() && user.role !== 'admin') {
      return { error: 'Not authorized' };
    }
    
    // Check if cancellation is allowed (e.g., not too close to event date)
    const event = await Event.findById(booking.eventId);
    if (!event) {
      return { error: 'Event not found' };
    }
    
    const hoursUntilEvent = (event.date.getTime() - new Date().getTime()) / (1000 * 60 * 60);
    if (hoursUntilEvent < 24) {
      return { error: 'Cancellation not allowed within 24 hours of event' };
    }
    
    // Start transaction
    const session = await Booking.startSession();
    session.startTransaction();
    
    try {
      // Update event seats
      event.availableSeats += booking.tickets;
      await event.save({ session });
      
      // Update booking status
      booking.status = 'cancelled';
      await booking.save({ session });
      
      // Commit transaction
      await session.commitTransaction();
      session.endSession();
      
      revalidatePath('/user/home');
      revalidatePath(`/events/${event._id}`);
      
      return { success: true, message: 'Booking cancelled successfully' };
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  } catch (error) {
    console.error('Cancellation error:', error);
    return { error: 'Cancellation failed. Please try again.' };
  }
}

export async function getUserBookings() {
  const user = await requireAuth();
  await dbConnect();
  
  try {
    const bookings = await Booking.find({ userId: user._id })
      .populate('eventId')
      .sort({ createdAt: -1 });
    
    return { success: true, bookings };
  } catch (error) {
    console.error('Bookings fetch error:', error);
    return { error: 'Failed to fetch bookings' };
  }
}

export async function getEventBookings(eventId: string) {
  await requireAuth('admin');
  await dbConnect();
  
  try {
    const bookings = await Booking.find({ eventId })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });
    
    return { success: true, bookings };
  } catch (error) {
    console.error('Event bookings fetch error:', error);
    return { error: 'Failed to fetch event bookings' };
  }
}