import { redirect } from 'next/navigation';
import { getToken } from '@/actions/authActions';
import { getCurrentUser } from '@/lib/auth';

export default async function Home() {
  const token = await getToken();
  const userDoc = token ? await getCurrentUser(token) : null;
  
  if (userDoc) {
    if (userDoc.role === 'admin') {
      redirect('/admin/dashboard');
    } else {
      redirect('/user/home');
    }
  }
  
  redirect('/welcome');
}