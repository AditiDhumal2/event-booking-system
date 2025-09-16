import dbConnect from '@/lib/mongoose';
import { User } from '@/models/User';
import { Event } from '@/models/Event';

// ----- TYPES -----
export type UserType = {
  _id: string;
  name: string;
  email: string;
  role: string;
};

export type EventType = {
  _id: string;
  title: string;
  description: string;
  location: string;
  totalSeats: number;
  availableSeats: number;
  date: Date;
};

// ===== USER ACTIONS =====
export async function getAllUsers(): Promise<{ success: true; users: UserType[] } | { success: false; error: string }> {
  try {
    await dbConnect();
    const users = await User.find({});
    return {
      success: true,
      users: users.map(u => ({
        _id: u._id.toString(),
        name: u.name,
        email: u.email,
        role: u.role,
      })),
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to fetch users' };
  }
}

export async function makeUserAdmin(userId: string): Promise<{ success: true; message: string } | { success: false; error: string }> {
  try {
    await dbConnect();
    const user = await User.findById(userId);
    if (!user) return { success: false, error: 'User not found' };
    user.role = 'admin';
    await user.save();
    return { success: true, message: 'User promoted to admin' };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to make user admin' };
  }
}

// ===== EVENT ACTIONS =====
export async function getAllEvents(): Promise<{ success: true; events: EventType[] } | { success: false; error: string }> {
  try {
    await dbConnect();
    const events = await Event.find({});
    return {
      success: true,
      events: events.map(e => ({
        _id: e._id.toString(),
        title: e.title,
        description: e.description,
        location: (e as any).location,          // explicitly map properties
        totalSeats: (e as any).totalSeats,
        availableSeats: (e as any).availableSeats,
        date: e.date,
      })),
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to fetch events' };
  }
}

export async function addEvent(eventData: Omit<EventType, '_id'>): Promise<{ success: true; message: string } | { success: false; error: string }> {
  try {
    await dbConnect();
    const event = new Event(eventData);
    await event.save();
    return { success: true, message: 'Event added successfully' };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to add event' };
  }
}

export async function deleteEvent(eventId: string): Promise<{ success: true; message: string } | { success: false; error: string }> {
  try {
    await dbConnect();
    await Event.findByIdAndDelete(eventId);
    return { success: true, message: 'Event deleted successfully' };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to delete event' };
  }
}
