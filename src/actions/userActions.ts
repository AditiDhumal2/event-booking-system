'use server';

import { revalidatePath } from 'next/cache';
import dbConnect from '@/lib/mongoose';
import { generateToken } from '@/lib/jwt';
import { setToken } from './authActions';
import { getToken } from './authActions';
import { getCurrentUser } from '@/lib/auth';

async function getUserModel() {
  await dbConnect();
  const { User } = await import('@/models/User');
  return User;
}

// ------------------ GET CURRENT USER DATA ------------------
export async function getCurrentUserData() {
  try {
    const token = await getToken();
    if (!token) return null;
    
    const user = await getCurrentUser(token);
    if (!user) return null;
    
    return {
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role
    };
  } catch (error) {
    console.error('Error getting current user data:', error);
    return null;
  }
}

// ------------------ REGISTER USER ------------------
export async function registerUser(prevState: any, formData: FormData) {
  const User = await getUserModel();

  const firstName = formData.get('firstName') as string;
  const lastName = formData.get('lastName') as string;
  const email = formData.get('email') as string;
  const phone = formData.get('phone') as string;
  const password = formData.get('password') as string;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return { error: 'User already exists with this email' };
    }

    // Create new user (defaults to role "user")
    const user = new User({
      name: `${firstName} ${lastName}`,
      email,
      phone,
      password
    });

    await user.save();

    return { success: true, message: 'Registration successful. Please login.' };
  } catch (error) {
    console.error('Registration error:', error);
    return { error: 'Registration failed. Please try again.' };
  }
}

// ------------------ LOGIN USER ------------------
export async function loginUser(prevState: any, formData: FormData) {
  const User = await getUserModel();

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return { error: 'Invalid email or password' };
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return { error: 'Invalid email or password' };
    }

    // Generate JWT & set cookie
    const token = generateToken(user);
    await setToken(token);

    // Return user data along with redirect
    return {
      success: true,
      redirectTo: '/user/home', // Always redirect to user homepage
      user: {
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role
      }
    };
  } catch (error) {
    console.error('Login error:', error);
    return { error: 'Login failed. Please try again.' };
  }
}

// ------------------ UPDATE PROFILE ------------------
export async function updateProfile(prevState: any, formData: FormData) {
  const User = await getUserModel();

  const userId = formData.get('userId') as string;
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const phone = formData.get('phone') as string;

  try {
    const existingUser = await User.findOne({ email, _id: { $ne: userId } });
    if (existingUser) {
      return { error: 'Email is already taken by another user' };
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { name, email, phone },
      { new: true }
    ).select('-password');

    if (!user) {
      return { error: 'User not found' };
    }

    revalidatePath('/profile');

    return {
      success: true,
      user: {
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    };
  } catch (error) {
    console.error('Profile update error:', error);
    return { error: 'Profile update failed' };
  }
}

// ------------------ CHANGE PASSWORD ------------------
export async function changePassword(prevState: any, formData: FormData) {
  const User = await getUserModel();

  const userId = formData.get('userId') as string;
  const currentPassword = formData.get('currentPassword') as string;
  const newPassword = formData.get('newPassword') as string;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return { error: 'User not found' };
    }

    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return { error: 'Current password is incorrect' };
    }

    user.password = newPassword;
    await user.save();

    revalidatePath('/profile');

    return { success: true, message: 'Password updated successfully' };
  } catch (error) {
    console.error('Password change error:', error);
    return { error: 'Password change failed' };
  }
}

// ===== ADMIN ACTIONS =====
export type UserType = {
  _id: string;
  name: string;
  email: string;
  role: string;
};

export async function getAllUsers(): Promise<{ success: true; users: UserType[] } | { success: false; error: string }> {
  try {
    await dbConnect();
    const { User } = await import('@/models/User');
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
    const { User } = await import('@/models/User');
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
export type EventType = {
  _id: string;
  title: string;
  description: string;
  location: string;
  totalSeats: number;
  availableSeats: number;
  date: Date;
};

export async function getAllEvents(): Promise<{ success: true; events: EventType[] } | { success: false; error: string }> {
  try {
    await dbConnect();
    const { Event } = await import('@/models/Event');
    const events = await Event.find({});
    return {
      success: true,
      events: events.map(e => ({
        _id: e._id.toString(),
        title: e.title,
        description: e.description,
        location: (e as any).location,
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
    const { Event } = await import('@/models/Event');
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
    const { Event } = await import('@/models/Event');
    await Event.findByIdAndDelete(eventId);
    return { success: true, message: 'Event deleted successfully' };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to delete event' };
  }
}