'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function getToken() {
  const cookieStore = await cookies();
  return cookieStore.get('token')?.value;
}

export async function setToken(token: string) {
  const cookieStore = await cookies();
  cookieStore.set('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7, // 1 week
    path: '/',
  });
}

export async function deleteToken() {
  const cookieStore = await cookies();
  cookieStore.delete('token');
}

export async function logout() {
  await deleteToken();
  redirect('/auth/login');
}