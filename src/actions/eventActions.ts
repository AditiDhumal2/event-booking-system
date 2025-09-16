'use server';

import { revalidatePath } from 'next/cache';
import dbConnect from '@/lib/mongoose';
import { requireAuth } from '@/lib/auth';
import type { IEvent } from '@/models/Event';
import { Types } from 'mongoose';

// Define interfaces for type safety
interface EventPlain {
  _id: string;
  title: string;
  description: string;
  location: string;
  date: string;
  price: number;
  totalSeats: number;
  availableSeats: number;
  imageUrl: string;
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface Booking {
  _id: string;
  userId: string;
  userName: string;
  userEmail: string;
  tickets: number;
  totalAmount: number;
  status: string;
  createdAt: string;
}

// Import models inside the functions to ensure they're registered after connection
async function getEventModel() {
  await dbConnect();
  try {
    // Import the Event model using named import
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
    // Import the User model using named import
    const { User } = await import('@/models/User');
    return User;
  } catch (error) {
    console.error('Error importing User model:', error);
    throw new Error('Failed to load User model');
  }
}

async function getBookingModel() {
  await dbConnect();
  try {
    // Import the Booking model using named import
    const { Booking } = await import('@/models/Booking');
    return Booking;
  } catch (error) {
    console.error('Error importing Booking model:', error);
    throw new Error('Failed to load Booking model');
  }
}

// Helper function to safely convert dates to ISO strings
function safeToISOString(date: any): string {
  if (!date) return new Date().toISOString();
  if (typeof date === 'string') return new Date(date).toISOString();
  if (date instanceof Date) return date.toISOString();
  return new Date().toISOString();
}

// Helper function to convert aggregation result to plain object
function convertAggregationEventToPlain(event: any): EventPlain {
  return {
    _id: event._id?.toString() || '',
    title: event.title || '',
    description: event.description || '',
    location: event.location || '',
    date: safeToISOString(event.date),
    price: event.price || 0,
    totalSeats: event.totalSeats || 0,
    availableSeats: event.availableSeats || 0,
    imageUrl: event.imageUrl || '',
    createdBy: {
      _id: event.createdBy?._id?.toString() || '',
      name: event.createdBy?.name || 'Unknown',
      email: event.createdBy?.email || ''
    },
    createdAt: safeToISOString(event.createdAt),
    updatedAt: safeToISOString(event.updatedAt)
  };
}

// Type assertion helper for IEvent documents
function assertEventDocument(doc: any): asserts doc is IEvent & {
  totalSeats: number;
  availableSeats: number;
  save: () => Promise<any>;
} {
  if (!doc || typeof doc.totalSeats !== 'number' || typeof doc.availableSeats !== 'number') {
    throw new Error('Invalid event document');
  }
}

export async function createEvent(formData: FormData) {
  const user = await requireAuth();
  const Event = await getEventModel();
  
  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const location = formData.get('location') as string;
  const date = formData.get('date') as string;
  const price = parseFloat(formData.get('price') as string);
  const totalSeats = parseInt(formData.get('totalSeats') as string);
  const imageUrl = formData.get('imageUrl') as string;
  
  try {
    const event = new Event({
      title,
      description,
      location,
      date: new Date(date),
      price,
      totalSeats,
      availableSeats: totalSeats,
      imageUrl,
      createdBy: user._id
    });
    
    await event.save();
    revalidatePath('/admin/events');
    
    // Convert to plain object
    const plainEvent = convertAggregationEventToPlain(event);
    return { success: true, event: plainEvent };
  } catch (error) {
    console.error('Event creation error:', error);
    return { success: false, error: 'Event creation failed' };
  }
}

export async function updateEvent(eventId: string, formData: FormData) {
  await requireAuth();
  const Event = await getEventModel();
  
  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const location = formData.get('location') as string;
  const date = formData.get('date') as string;
  const price = parseFloat(formData.get('price') as string);
  const totalSeats = parseInt(formData.get('totalSeats') as string);
  const imageUrl = formData.get('imageUrl') as string;
  
  try {
    const event = await Event.findById(eventId);
    if (!event) {
      return { success: false, error: 'Event not found' };
    }
    
    // Use type assertion to tell TypeScript about the document properties
    assertEventDocument(event);
    
    // Calculate new available seats if total seats changed
    const seatsDifference = totalSeats - event.totalSeats;
    const newAvailableSeats = event.availableSeats + seatsDifference;
    
    const updatedEvent = await Event.findByIdAndUpdate(
      eventId,
      {
        title,
        description,
        location,
        date: new Date(date),
        price,
        totalSeats,
        availableSeats: newAvailableSeats > 0 ? newAvailableSeats : 0,
        imageUrl
      },
      { new: true }
    );
    
    if (!updatedEvent) {
      return { success: false, error: 'Event not found' };
    }
    
    revalidatePath('/admin/events');
    revalidatePath(`/events/${eventId}`);
    
    // Convert to plain object
    const plainEvent = convertAggregationEventToPlain(updatedEvent);
    return { success: true, event: plainEvent };
  } catch (error) {
    console.error('Event update error:', error);
    return { success: false, error: 'Event update failed' };
  }
}

export async function deleteEvent(eventId: string) {
  await requireAuth();
  const Event = await getEventModel();
  
  try {
    await Event.findByIdAndDelete(eventId);
    revalidatePath('/admin/events');
    return { success: true };
  } catch (error) {
    console.error('Event deletion error:', error);
    return { success: false, error: 'Event deletion failed' };
  }
}

export async function getEvents(filters = {}): Promise<{ success: boolean; events?: EventPlain[]; error?: string }> {
  const Event = await getEventModel();
  
  try {
    // Use aggregation instead of populate
    const events = await Event.aggregate([
      { $match: filters },
      { $sort: { date: 1 } },
      {
        $lookup: {
          from: 'users',
          localField: 'createdBy',
          foreignField: '_id',
          as: 'creator'
        }
      },
      {
        $unwind: {
          path: '$creator',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          title: 1,
          description: 1,
          location: 1,
          date: 1,
          price: 1,
          totalSeats: 1,
          availableSeats: 1,
          imageUrl: 1,
          createdAt: 1,
          updatedAt: 1,
          'createdBy._id': '$creator._id',
          'createdBy.name': '$creator.name',
          'createdBy.email': '$creator.email'
        }
      }
    ]);
    
    if (!events || events.length === 0) {
      return { success: true, events: [] };
    }
    
    // Convert all events to plain objects with proper typing and fallback values
    const plainEvents: EventPlain[] = events.map((event: any) => ({
      _id: event._id?.toString() || '',
      title: event.title || '',
      description: event.description || '',
      location: event.location || '',
      date: safeToISOString(event.date),
      price: event.price || 0,
      totalSeats: event.totalSeats || 0,
      availableSeats: event.availableSeats || 0,
      imageUrl: event.imageUrl || '',
      createdBy: {
        _id: event.createdBy?._id?.toString() || '',
        name: event.createdBy?.name || 'Unknown',
        email: event.createdBy?.email || ''
      },
      createdAt: safeToISOString(event.createdAt),
      updatedAt: safeToISOString(event.updatedAt)
    }));
    
    return { success: true, events: plainEvents };
  } catch (error) {
    console.error('Events fetch error:', error);
    return { success: false, error: 'Failed to fetch events' };
  }
}

export async function getEventById(eventId: string): Promise<{ success: boolean; event?: EventPlain; error?: string }> {
  const Event = await getEventModel();
  
  try {
    // Use aggregation instead of populate for single event
    const events = await Event.aggregate([
      { $match: { _id: new Types.ObjectId(eventId) } },
      {
        $lookup: {
          from: 'users',
          localField: 'createdBy',
          foreignField: '_id',
          as: 'creator'
        }
      },
      {
        $unwind: {
          path: '$creator',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          title: 1,
          description: 1,
          location: 1,
          date: 1,
          price: 1,
          totalSeats: 1,
          availableSeats: 1,
          imageUrl: 1,
          createdAt: 1,
          updatedAt: 1,
          'createdBy._id': '$creator._id',
          'createdBy.name': '$creator.name',
          'createdBy.email': '$creator.email'
        }
      }
    ]);
    
    if (!events || events.length === 0) {
      return { success: false, error: 'Event not found' };
    }
    
    const event = events[0];
    
    // Convert to plain object with proper typing and fallback values
    const plainEvent: EventPlain = {
      _id: event._id?.toString() || '',
      title: event.title || '',
      description: event.description || '',
      location: event.location || '',
      date: safeToISOString(event.date),
      price: event.price || 0,
      totalSeats: event.totalSeats || 0,
      availableSeats: event.availableSeats || 0,
      imageUrl: event.imageUrl || '',
      createdBy: {
        _id: event.createdBy?._id?.toString() || '',
        name: event.createdBy?.name || 'Unknown',
        email: event.createdBy?.email || ''
      },
      createdAt: safeToISOString(event.createdAt),
      updatedAt: safeToISOString(event.updatedAt)
    };
    
    return { success: true, event: plainEvent };
  } catch (error) {
    console.error('Event fetch error:', error);
    return { success: false, error: 'Failed to fetch event' };
  }
}

export async function getFeaturedEvents(): Promise<{ success: boolean; events?: EventPlain[]; error?: string }> {
  const Event = await getEventModel();
  
  try {
    // Use aggregation instead of populate for featured events
    const events = await Event.aggregate([
      { $match: {} },
      { $sort: { date: 1 } },
      { $limit: 3 },
      {
        $lookup: {
          from: 'users',
          localField: 'createdBy',
          foreignField: '_id',
          as: 'creator'
        }
      },
      {
        $unwind: {
          path: '$creator',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          title: 1,
          description: 1,
          location: 1,
          date: 1,
          price: 1,
          totalSeats: 1,
          availableSeats: 1,
          imageUrl: 1,
          createdAt: 1,
          updatedAt: 1,
          'createdBy._id': '$creator._id',
          'createdBy.name': '$creator.name',
          'createdBy.email': '$creator.email'
        }
      }
    ]);
    
    if (!events || events.length === 0) {
      return { success: true, events: [] };
    }
    
    // Convert all events to plain objects with proper typing and fallback values
    const plainEvents: EventPlain[] = events.map((event: any) => ({
      _id: event._id?.toString() || '',
      title: event.title || '',
      description: event.description || '',
      location: event.location || '',
      date: safeToISOString(event.date),
      price: event.price || 0,
      totalSeats: event.totalSeats || 0,
      availableSeats: event.availableSeats || 0,
      imageUrl: event.imageUrl || '',
      createdBy: {
        _id: event.createdBy?._id?.toString() || '',
        name: event.createdBy?.name || 'Unknown',
        email: event.createdBy?.email || ''
      },
      createdAt: safeToISOString(event.createdAt),
      updatedAt: safeToISOString(event.updatedAt)
    }));
    
    return { success: true, events: plainEvents };
  } catch (error) {
    console.error('Featured events fetch error:', error);
    return { success: false, error: 'Failed to fetch featured events' };
  }
}

// NEW FUNCTIONS FOR BOOKINGS PAGE

export async function getEvent(eventId: string): Promise<{ success: boolean; event?: EventPlain; error?: string }> {
  return getEventById(eventId);
}

export async function getEventBookings(eventId: string): Promise<{ success: boolean; bookings?: Booking[]; error?: string }> {
  const Booking = await getBookingModel();
  
  try {
    // Use aggregation to get bookings with user information
    const bookings = await Booking.aggregate([
      { $match: { eventId: new Types.ObjectId(eventId) } },
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
          userId: 1,
          userName: '$user.name',
          userEmail: '$user.email',
          tickets: 1,
          totalAmount: 1,
          status: 1,
          createdAt: 1
        }
      },
      { $sort: { createdAt: -1 } }
    ]);
    
    if (!bookings || bookings.length === 0) {
      return { success: true, bookings: [] };
    }
    
    // Convert bookings to plain objects with proper typing
    const plainBookings: Booking[] = bookings.map((booking: any) => ({
      _id: booking._id?.toString() || '',
      userId: booking.userId?.toString() || '',
      userName: booking.userName || 'Unknown User',
      userEmail: booking.userEmail || '',
      tickets: booking.tickets || 0,
      totalAmount: booking.totalAmount || 0,
      status: booking.status || 'pending',
      createdAt: safeToISOString(booking.createdAt)
    }));
    
    return { success: true, bookings: plainBookings };
  } catch (error) {
    console.error('Bookings fetch error:', error);
    return { success: false, error: 'Failed to fetch bookings' };
  }
}