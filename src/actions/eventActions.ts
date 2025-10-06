'use server';

import { revalidatePath } from 'next/cache';
import dbConnect from '@/lib/mongoose';
import { requireAuth } from '@/lib/auth';
import { Types } from 'mongoose';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

// Define interfaces for type safety
interface EventPlain {
  _id: string;
  title: string;
  description: string;
  location: string;
  date: string;
  time: string;
  price: number;
  totalSeats: number;
  availableSeats: number;
  category: string;
  imageUrls: string[];
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
    time: event.time || '',
    price: event.price || 0,
    totalSeats: event.totalSeats || 0,
    availableSeats: event.availableSeats || 0,
    category: event.category || 'other',
    imageUrls: event.imageUrls || [],
    createdBy: {
      _id: event.createdBy?._id?.toString() || '',
      name: event.createdBy?.name || 'Unknown',
      email: event.createdBy?.email || ''
    },
    createdAt: safeToISOString(event.createdAt),
    updatedAt: safeToISOString(event.updatedAt)
  };
}

// Type assertion helper for Event documents
function assertEventDocument(doc: any): asserts doc is {
  _id: any;
  totalSeats: number;
  availableSeats: number;
  save: () => Promise<any>;
} {
  if (!doc || typeof doc.totalSeats !== 'number' || typeof doc.availableSeats !== 'number') {
    throw new Error('Invalid event document');
  }
}

// File upload helper function
async function uploadImages(files: File[]): Promise<string[]> {
  const imageUrls: string[] = [];
  
  for (const file of files) {
    try {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error(`File ${file.name} is not an image`);
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error(`File ${file.name} is too large. Maximum size is 5MB`);
      }
      
      // Convert file to buffer
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      // Create unique filename
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 8);
      const fileExtension = path.extname(file.name) || '.jpg';
      const filename = `event-${timestamp}-${randomString}${fileExtension}`;
      
      // Ensure public/events directory exists
      const eventsDir = path.join(process.cwd(), 'public', 'events');
      await mkdir(eventsDir, { recursive: true });
      
      // Write file to public/events directory
      const filePath = path.join(eventsDir, filename);
      await writeFile(filePath, buffer);
      
      // The URL should be relative to the public folder
      const imageUrl = `/events/${filename}`;
      imageUrls.push(imageUrl);
      
      console.log(`✅ Image saved: ${imageUrl}`);
      
    } catch (error) {
      console.error(`❌ Failed to upload ${file.name}:`, error);
      throw error;
    }
  }
  
  return imageUrls;
}

export async function createEvent(formData: FormData) {
  const user = await requireAuth();
  const Event = await getEventModel();
  
  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const location = formData.get('location') as string;
  const date = formData.get('date') as string;
  const time = formData.get('time') as string;
  const price = parseFloat(formData.get('price') as string);
  const totalSeats = parseInt(formData.get('totalSeats') as string);
  const category = formData.get('category') as string;
  
  console.log('📝 Creating event with data:', {
    title,
    location,
    date,
    time,
    price,
    totalSeats,
    category
  });
  
  try {
    // Handle file uploads
    const imageFiles: File[] = [];
    
    // Get all files from FormData
    const images = formData.getAll('images');
    console.log('📁 Received files from FormData:', images.length);
    
    for (const image of images) {
      if (image instanceof File && image.size > 0 && image.name) {
        console.log('📄 File details:', {
          name: image.name,
          size: image.size,
          type: image.type
        });
        imageFiles.push(image);
      }
    }
    
    if (imageFiles.length === 0) {
      console.log('❌ No valid image files found');
      return { success: false, error: 'At least one image is required' };
    }
    
    console.log('🖼️ Processing', imageFiles.length, 'image files');
    const imageUrls = await uploadImages(imageFiles);
    console.log('✅ Uploaded images URLs:', imageUrls);
    
    const event = new Event({
      title,
      description,
      location,
      date: new Date(date),
      time,
      price,
      totalSeats,
      availableSeats: totalSeats,
      category,
      imageUrls,
      organizer: user._id
    });
    
    await event.save();
    console.log('💾 Event saved to database with images:', imageUrls);
    
    revalidatePath('/admin/events');
    revalidatePath('/user/home');
    revalidatePath('/');
    
    // Convert to plain object
    const plainEvent = convertAggregationEventToPlain(event);
    return { success: true, event: plainEvent };
  } catch (error) {
    console.error('❌ Event creation error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Event creation failed' };
  }
}

export async function updateEvent(eventId: string, formData: FormData) {
  await requireAuth();
  const Event = await getEventModel();
  
  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const location = formData.get('location') as string;
  const date = formData.get('date') as string;
  const time = formData.get('time') as string;
  const price = parseFloat(formData.get('price') as string);
  const totalSeats = parseInt(formData.get('totalSeats') as string);
  const category = formData.get('category') as string;
  
  console.log('📝 Updating event:', eventId);
  console.log('🔄 New category:', category);
  console.log('📊 Form data received:', {
    title,
    category,
    location,
    date,
    time,
    price,
    totalSeats
  });
  
  try {
    // First, let's check what the current event looks like
    const currentEvent = await Event.findById(eventId);
    console.log('📋 Current event before update:', {
      id: currentEvent?._id,
      currentCategory: currentEvent?.category,
      currentTitle: currentEvent?.title
    });
    
    if (!currentEvent) {
      console.log('❌ Event not found:', eventId);
      return { success: false, error: 'Event not found' };
    }
    
    // Use type assertion to tell TypeScript about the document properties
    assertEventDocument(currentEvent);
    
    // Handle existing images
    const existingImages = formData.getAll('existingImages') as string[];
    let imageUrls = existingImages || [];

    // Handle file uploads if new images are provided
    const imageFiles: File[] = [];
    const images = formData.getAll('images') as File[];
    
    console.log('📁 Received files for update:', images.length);
    
    for (const image of images) {
      if (image instanceof File && image.size > 0 && image.name) {
        console.log('📄 File details:', {
          name: image.name,
          size: image.size,
          type: image.type
        });
        imageFiles.push(image);
      }
    }
    
    if (imageFiles.length > 0) {
      console.log('🖼️ Processing', imageFiles.length, 'new image files');
      const newImageUrls = await uploadImages(imageFiles);
      imageUrls = [...imageUrls, ...newImageUrls];
      console.log('✅ Updated images URLs:', imageUrls);
    }

    // If no images remain, return error
    if (imageUrls.length === 0) {
      console.log('❌ No images found after update');
      return { success: false, error: 'At least one image is required' };
    }
    
    // Calculate new available seats if total seats changed
    const seatsDifference = totalSeats - currentEvent.totalSeats;
    const newAvailableSeats = currentEvent.availableSeats + seatsDifference;
    
    console.log('💺 Seat calculation:', {
      oldTotal: currentEvent.totalSeats,
      newTotal: totalSeats,
      oldAvailable: currentEvent.availableSeats,
      newAvailable: newAvailableSeats
    });
    
    const updateData = {
      title,
      description,
      location,
      date: new Date(date),
      time,
      price,
      totalSeats,
      category, // Make sure this is included
      availableSeats: newAvailableSeats > 0 ? newAvailableSeats : 0,
      imageUrls
    };
    
    console.log('🔄 Update data being sent:', updateData);
    
    const updatedEvent = await Event.findByIdAndUpdate(
      eventId,
      updateData,
      { new: true, runValidators: true } // Added runValidators to ensure category validation
    );
    
    if (!updatedEvent) {
      console.log('❌ Event not found after update attempt');
      return { success: false, error: 'Event not found' };
    }
    
    console.log('✅ Event updated successfully:', {
      id: updatedEvent._id,
      newCategory: updatedEvent.category,
      newTitle: updatedEvent.title
    });
    
    // Let's verify the update by fetching the event again
    const verifiedEvent = await Event.findById(eventId);
    console.log('🔍 Verified event after update:', {
      id: verifiedEvent?._id,
      verifiedCategory: verifiedEvent?.category,
      verifiedTitle: verifiedEvent?.title
    });

    revalidatePath('/admin/events');
    revalidatePath(`/events/${eventId}`);
    revalidatePath('/user/home');
    revalidatePath('/');
    
    console.log('🔄 Paths revalidated');
    
    // Convert to plain object
    const plainEvent = convertAggregationEventToPlain(updatedEvent);
    return { success: true, event: plainEvent };
  } catch (error) {
    console.error('❌ Event update error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Event update failed' };
  }
}

export async function deleteEvent(eventId: string) {
  await requireAuth();
  const Event = await getEventModel();
  
  console.log('🗑️ Deleting event:', eventId);
  
  try {
    await Event.findByIdAndDelete(eventId);
    revalidatePath('/admin/events');
    revalidatePath('/user/home');
    revalidatePath('/');
    console.log('✅ Event deleted successfully');
    return { success: true };
  } catch (error) {
    console.error('❌ Event deletion error:', error);
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
          localField: 'organizer',
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
          time: 1,
          price: 1,
          totalSeats: 1,
          availableSeats: 1,
          category: 1,
          imageUrls: 1,
          createdAt: 1,
          updatedAt: 1,
          'createdBy._id': '$creator._id',
          'createdBy.name': '$creator.name',
          'createdBy.email': '$creator.email'
        }
      }
    ]);
    
    if (!events || events.length === 0) {
      console.log('ℹ️ No events found with filters:', filters);
      return { success: true, events: [] };
    }
    
    // Convert all events to plain objects with proper typing and fallback values
    const plainEvents: EventPlain[] = events.map((event: any) => ({
      _id: event._id?.toString() || '',
      title: event.title || '',
      description: event.description || '',
      location: event.location || '',
      date: safeToISOString(event.date),
      time: event.time || '',
      price: event.price || 0,
      totalSeats: event.totalSeats || 0,
      availableSeats: event.availableSeats || 0,
      category: event.category || 'other',
      imageUrls: event.imageUrls || [],
      createdBy: {
        _id: event.createdBy?._id?.toString() || '',
        name: event.createdBy?.name || 'Unknown',
        email: event.createdBy?.email || ''
      },
      createdAt: safeToISOString(event.createdAt),
      updatedAt: safeToISOString(event.updatedAt)
    }));
    
    console.log(`✅ Fetched ${plainEvents.length} events`);
    return { success: true, events: plainEvents };
  } catch (error) {
    console.error('❌ Events fetch error:', error);
    return { success: false, error: 'Failed to fetch events' };
  }
}

export async function getEventById(eventId: string): Promise<{ success: boolean; event?: EventPlain; error?: string }> {
  const Event = await getEventModel();
  
  console.log('🔍 Fetching event by ID:', eventId);
  
  try {
    // Use aggregation instead of populate for single event
    const events = await Event.aggregate([
      { $match: { _id: new Types.ObjectId(eventId) } },
      {
        $lookup: {
          from: 'users',
          localField: 'organizer',
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
          time: 1,
          price: 1,
          totalSeats: 1,
          availableSeats: 1,
          category: 1,
          imageUrls: 1,
          createdAt: 1,
          updatedAt: 1,
          'createdBy._id': '$creator._id',
          'createdBy.name': '$creator.name',
          'createdBy.email': '$creator.email'
        }
      }
    ]);
    
    if (!events || events.length === 0) {
      console.log('❌ Event not found:', eventId);
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
      time: event.time || '',
      price: event.price || 0,
      totalSeats: event.totalSeats || 0,
      availableSeats: event.availableSeats || 0,
      category: event.category || 'other',
      imageUrls: event.imageUrls || [],
      createdBy: {
        _id: event.createdBy?._id?.toString() || '',
        name: event.createdBy?.name || 'Unknown',
        email: event.createdBy?.email || ''
      },
      createdAt: safeToISOString(event.createdAt),
      updatedAt: safeToISOString(event.updatedAt)
    };
    
    console.log('✅ Event fetched successfully:', {
      id: plainEvent._id,
      title: plainEvent.title,
      category: plainEvent.category,
      imageCount: plainEvent.imageUrls.length
    });
    
    return { success: true, event: plainEvent };
  } catch (error) {
    console.error('❌ Event fetch error:', error);
    return { success: false, error: 'Failed to fetch event' };
  }
}

export async function getFeaturedEvents(): Promise<{ success: boolean; events?: EventPlain[]; error?: string }> {
  const Event = await getEventModel();
  
  console.log('⭐ Fetching featured events');
  
  try {
    // Use aggregation instead of populate for featured events
    const events = await Event.aggregate([
      { $match: {} },
      { $sort: { date: 1 } },
      { $limit: 3 },
      {
        $lookup: {
          from: 'users',
          localField: 'organizer',
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
          time: 1,
          price: 1,
          totalSeats: 1,
          availableSeats: 1,
          category: 1,
          imageUrls: 1,
          createdAt: 1,
          updatedAt: 1,
          'createdBy._id': '$creator._id',
          'createdBy.name': '$creator.name',
          'createdBy.email': '$creator.email'
        }
      }
    ]);
    
    if (!events || events.length === 0) {
      console.log('ℹ️ No featured events found');
      return { success: true, events: [] };
    }
    
    // Convert all events to plain objects with proper typing and fallback values
    const plainEvents: EventPlain[] = events.map((event: any) => ({
      _id: event._id?.toString() || '',
      title: event.title || '',
      description: event.description || '',
      location: event.location || '',
      date: safeToISOString(event.date),
      time: event.time || '',
      price: event.price || 0,
      totalSeats: event.totalSeats || 0,
      availableSeats: event.availableSeats || 0,
      category: event.category || 'other',
      imageUrls: event.imageUrls || [],
      createdBy: {
        _id: event.createdBy?._id?.toString() || '',
        name: event.createdBy?.name || 'Unknown',
        email: event.createdBy?.email || ''
      },
      createdAt: safeToISOString(event.createdAt),
      updatedAt: safeToISOString(event.updatedAt)
    }));
    
    console.log(`✅ Fetched ${plainEvents.length} featured events`);
    return { success: true, events: plainEvents };
  } catch (error) {
    console.error('❌ Featured events fetch error:', error);
    return { success: false, error: 'Failed to fetch featured events' };
  }
}

// NEW FUNCTIONS FOR BOOKINGS PAGE

export async function getEvent(eventId: string): Promise<{ success: boolean; event?: EventPlain; error?: string }> {
  return getEventById(eventId);
}

export async function getEventBookings(eventId: string): Promise<{ success: boolean; bookings?: Booking[]; error?: string }> {
  const Booking = await getBookingModel();
  
  console.log('📊 Fetching bookings for event:', eventId);
  
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
      console.log('ℹ️ No bookings found for event:', eventId);
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
    
    console.log(`✅ Fetched ${plainBookings.length} bookings for event`);
    return { success: true, bookings: plainBookings };
  } catch (error) {
    console.error('❌ Bookings fetch error:', error);
    return { success: false, error: 'Failed to fetch bookings' };
  }
}