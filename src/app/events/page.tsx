import { redirect } from 'next/navigation';
import { getToken } from '@/actions/authActions';
import { getCurrentUser } from '@/lib/auth';

export default async function AdminEventsPage() {
  const token = await getToken();
  if (!token) {
    redirect('/auth/login');
  }

  const userDoc = await getCurrentUser(token);
  if (!userDoc || userDoc.role !== 'admin') {
    redirect('/auth/login');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Manage Events</h1>
        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-gray-600">Events management page will be implemented here.</p>
        </div>
      </div>
    </div>
  );
}