import { redirect } from 'next/navigation';
import { getToken } from '@/actions/authActions';
import { getCurrentUser } from '@/lib/auth';
import ProfileClient from './ProfileClient';

export default async function ProfilePage() {
  const token = await getToken();
  if (!token) {
    redirect('/auth/login');
  }

  const userDoc = await getCurrentUser(token);
  if (!userDoc) {
    redirect('/auth/login');
  }

  // Convert MongoDB document to plain object
  const user = {
    _id: userDoc._id.toString(),
    name: userDoc.name,
    email: userDoc.email,
    role: userDoc.role
  };

  return <ProfileClient user={user} />;
}