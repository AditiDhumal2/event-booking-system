import jwt from 'jsonwebtoken';
import { redirect } from 'next/navigation';
import { getToken } from '@/actions/authActions';

const JWT_SECRET = process.env.JWT_SECRET!;

if (!JWT_SECRET) {
  throw new Error('Please define the JWT_SECRET environment variable inside .env.local');
}

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

export function generateToken(user: any): string {
  return jwt.sign(
    { userId: user._id.toString(), email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch (error) {
    return null;
  }
}

export async function getCurrentUser(token?: string) {
  if (!token) return null;

  const decoded = verifyToken(token);
  if (!decoded) return null;

  try {
    // Import here to avoid circular dependencies
    const { User } = await import('@/models/User');
    await import('@/lib/mongoose').then(mod => mod.default());
    
    const user = await User.findById(decoded.userId).select('-password');
    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

export async function requireAuth(role?: 'admin') {
  const token = await getToken();
  const user = await getCurrentUser(token);
  
  if (!user) {
    redirect('/auth/login');
  }
  
  if (role && user.role !== role) {
    redirect('/');
  }
  
  return user;
}