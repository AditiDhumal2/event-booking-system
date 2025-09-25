'use server';

import { verifyToken } from './jwt';
import { getToken } from '@/actions/authActions';
import { redirect } from 'next/navigation';

export async function getCurrentUser(token: string) {
  try {
    const decoded = verifyToken(token);
    if (!decoded) return null;

    // Import inside function to avoid server-side issues
    const { default: dbConnect } = await import('@/lib/mongoose');
    await dbConnect();
    
    const { User } = await import('@/models/User');
    const user = await User.findById(decoded.userId).select('-password');
    
    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

// Add the requireAuth function
export async function requireAuth() {
  const token = await getToken();
  if (!token) {
    redirect('/auth/login');
  }

  const user = await getCurrentUser(token);
  if (!user) {
    redirect('/auth/login');
  }

  return user;
}

// Add requireAdmin function for admin-specific routes
export async function requireAdmin() {
  const user = await requireAuth();
  if (user.role !== 'admin') {
    redirect('/user/home');
  }
  return user;
}