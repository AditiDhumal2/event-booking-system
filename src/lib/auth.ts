'use server';

import jwt from 'jsonwebtoken';
import { redirect } from 'next/navigation';
import dbConnect from '@/lib/mongoose';
import { User } from '@/models/User';
import { getToken } from '@/actions/authActions';

const JWT_SECRET = process.env.JWT_SECRET!;
if (!JWT_SECRET) throw new Error('JWT_SECRET not defined in .env.local');

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

export function generateTokenForUser(user: any): string {
  return jwt.sign(
    { userId: user._id.toString(), email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

export async function getCurrentUser(token?: string) {
  if (!token) return null;

  const decoded = verifyToken(token);
  if (!decoded) return null;

  await dbConnect();
  const user = await User.findById(decoded.userId).select('-password');
  return user;
}

export async function requireAuth(role?: 'admin') {
  const token = getToken();
  const user = await getCurrentUser(token);

  if (!user) redirect('/auth/login');
  if (role && user.role !== role) redirect('/');

  return user;
}
