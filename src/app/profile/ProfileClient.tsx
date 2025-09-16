'use client';

import { useState } from 'react';
import { useActionState } from 'react';
import { useRouter } from 'next/navigation';
import { updateProfile, changePassword } from '@/actions/userActions';
import { logout } from '@/actions/authActions';
import PasswordInput from '@/components/shared/PasswordInput';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
}

interface ProfileClientProps {
  user: User;
}

export default function ProfileClient({ user }: ProfileClientProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [profileState, profileAction, isProfilePending] = useActionState(updateProfile, { error: '' });
  const [passwordState, passwordAction, isPasswordPending] = useActionState(changePassword, { error: '' });
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/auth/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800">Profile</h1>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Logout
            </button>
          </div>

          {/* Profile Information */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800">Personal Information</h2>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Edit Profile
                </button>
              )}
            </div>

            {isEditing ? (
              <form action={profileAction}>
                <input type="hidden" name="userId" value={user._id} />
                <div className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      defaultValue={user.name}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      defaultValue={user.email}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <button
                      type="submit"
                      disabled={isProfilePending}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {isProfilePending ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>

                  {profileState?.error && (
                    <div className="text-red-600 text-sm mt-2">{profileState.error}</div>
                  )}
                  {profileState?.success && (
                    <div className="text-green-600 text-sm mt-2">Profile updated successfully!</div>
                  )}
                </div>
              </form>
            ) : (
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-gray-600">Name:</span>
                  <p className="text-lg text-gray-800">{user.name}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Email:</span>
                  <p className="text-lg text-gray-800">{user.email}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Role:</span>
                  <p className="text-lg text-gray-800 capitalize">{user.role}</p>
                </div>
              </div>
            )}
          </div>

          {/* Change Password */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800">Change Password</h2>
              {!isChangingPassword && (
                <button
                  onClick={() => setIsChangingPassword(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Change Password
                </button>
              )}
            </div>

            {isChangingPassword ? (
              <form action={passwordAction}>
                <input type="hidden" name="userId" value={user._id} />
                <div className="space-y-4">
                  <div>
                    <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                      Current Password
                    </label>
                    <PasswordInput
                      id="currentPassword"
                      name="currentPassword"
                      placeholder="Enter your current password"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                      New Password
                    </label>
                    <PasswordInput
                      id="newPassword"
                      name="newPassword"
                      placeholder="Enter your new password"
                      required
                    />
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <button
                      type="submit"
                      disabled={isPasswordPending}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {isPasswordPending ? 'Updating...' : 'Update Password'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsChangingPassword(false)}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>

                  {passwordState?.error && (
                    <div className="text-red-600 text-sm mt-2">{passwordState.error}</div>
                  )}
                  {passwordState?.success && (
                    <div className="text-green-600 text-sm mt-2">Password updated successfully!</div>
                  )}
                </div>
              </form>
            ) : (
              <p className="text-gray-600">Click the button above to change your password.</p>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {user.role === 'admin' ? (
                <>
                  <a
                    href="/admin/dashboard"
                    className="p-4 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors"
                  >
                    <h3 className="font-semibold text-blue-800">Admin Dashboard</h3>
                    <p className="text-sm text-blue-600">Manage events and bookings</p>
                  </a>
                  <a
                    href="/admin/events"
                    className="p-4 bg-green-100 rounded-lg hover:bg-green-200 transition-colors"
                  >
                    <h3 className="font-semibold text-green-800">Manage Events</h3>
                    <p className="text-sm text-green-600">Create and edit events</p>
                  </a>
                </>
              ) : (
                <>
                  <a
                    href="/user/home"
                    className="p-4 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors"
                  >
                    <h3 className="font-semibold text-blue-800">Browse Events</h3>
                    <p className="text-sm text-blue-600">Discover upcoming events</p>
                  </a>
                  <a
                    href="/user/bookings"
                    className="p-4 bg-green-100 rounded-lg hover:bg-green-200 transition-colors"
                  >
                    <h3 className="font-semibold text-green-800">My Bookings</h3>
                    <p className="text-sm text-green-600">View your ticket bookings</p>
                  </a>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}