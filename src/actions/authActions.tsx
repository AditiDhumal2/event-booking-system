'use server';

import dbConnect from '@/lib/mongoose';
import User from '@/models/User';
import { generateTokenForUser } from '@/lib/auth';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';

// ===================
// REGISTER USER
// ===================
export async function registerUser(
  name: string,
  email: string,
  password: string
) {
  await dbConnect();

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new Error('User already exists');
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
  });

  const token = generateTokenForUser(user);

  cookies().set({
    name: 'token',
    value: token,
    httpOnly: true,
    path: '/',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });

  return { user, token };
}

// ===================
// LOGIN USER
// ===================
export async function loginUser(email: string, password: string) {
  await dbConnect();

  const user = await User.findOne({ email });
  if (!user) throw new Error('Invalid credentials');

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new Error('Invalid credentials');

  const token = generateTokenForUser(user);

  cookies().set({
    name: 'token',
    value: token,
    httpOnly: true,
    path: '/',
    maxAge: 7 * 24 * 60 * 60,
  });

  return { user, token };
}

// ===================
// LOGOUT USER
// ===================
export function logoutUser() {
  cookies().delete('token', { path: '/' });
}

// ===================
// GET CURRENT USER TOKEN
// ===================
export function getToken(): string | undefined {
  return cookies().get('token')?.value;
}
