'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface UserNavigationProps {
  userName: string;
  userRole: string;
}

export default function UserNavigation({ userName, userRole }: UserNavigationProps) {
  const pathname = usePathname();

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/user/home" className="text-xl font-bold text-blue-600">
            EventBook
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center space-x-6">
            {/* Home Link */}
            <Link
              href="/user/home"
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                pathname === '/user/home'
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              Home
            </Link>

            {/* Profile Link */}
            <Link
              href="/profile"
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                pathname === '/profile'
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              Profile
            </Link>

            {/* Admin Dashboard Link (only for admins) */}
            {userRole === 'admin' && (
              <Link
                href="/admin/dashboard"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  pathname.startsWith('/admin')
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-blue-600'
                }`}
              >
                Admin
              </Link>
            )}

            {/* Logout Button */}
            <form action="/auth/logout" method="POST">
              <button
                type="submit"
                className="px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-blue-600"
              >
                Logout
              </button>
            </form>
          </div>
        </div>
      </div>
    </nav>
  );
}