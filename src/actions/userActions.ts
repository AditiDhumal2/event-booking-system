'use server';

import { revalidatePath } from 'next/cache';
import dbConnect from '@/lib/mongoose';
import { generateToken } from '@/lib/auth';
import { setToken } from './authActions';

async function getUserModel() {
  await dbConnect();
  const { User } = await import('@/models/User');
  return User;
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

    // ✅ Role-based redirect
    return {
      success: true,
      redirectTo: user.role === 'admin' ? '/admin/dashboard' : '/user/home'
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
