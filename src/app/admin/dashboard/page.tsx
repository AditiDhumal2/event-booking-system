'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getEvents } from '@/actions/eventActions';

interface EventType {
  _id: string;
  title: string;
  description: string;
  location: string;
  date: string;
  totalSeats: number;
  bookedSeats?: number;
  price?: number;
}

export default function DashboardPage() {
  const [upcomingEvents, setUpcomingEvents] = useState<EventType[]>([]);

  useEffect(() => {
    async function fetchEvents() {
      try {
        const result = await getEvents(); // fetch all events
        if (result.success && result.events) {
          const now = new Date();
          const futureEvents: EventType[] = result.events
            .map((e: any) => ({
              ...e,
              bookedSeats: e.bookedSeats || 0,
              price: e.price || 0,
              date: e.date
            }))
            .filter((e: EventType) => new Date(e.date) >= now);

          setUpcomingEvents(futureEvents);
        }
      } catch (err) {
        console.error('Error fetching events:', err);
      }
    }

    fetchEvents();
  }, []);

  return (
    <div>
      {/* Welcome Banner */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-2xl font-bold mb-2">Welcome back, Admin!</h2>
        <p className="text-gray-600">Manage your event booking system</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow flex items-center space-x-4">
          <div className="w-12 h-12 flex items-center justify-center bg-blue-100 text-blue-600 rounded-lg text-xl">
            📅
          </div>
          <div>
            <h3 className="text-lg font-semibold">{upcomingEvents.length}</h3>
            <p className="text-gray-600 text-sm">Upcoming Events</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <Link
            href="/admin/events/new"
            className="bg-blue-100 p-6 rounded-lg text-center hover:bg-blue-200 cursor-pointer"
          >
            <p className="text-xl mb-2">➕</p>
            <h4 className="font-semibold">Add New Event</h4>
            <p className="text-gray-600 text-sm">Create a new event</p>
          </Link>

          <Link
            href="/admin/events"
            className="bg-green-100 p-6 rounded-lg text-center hover:bg-green-200 cursor-pointer"
          >
            <p className="text-xl mb-2">✏️</p>
            <h4 className="font-semibold">Manage Events</h4>
            <p className="text-gray-600 text-sm">Edit existing events</p>
          </Link>

          <Link
            href="/admin/users"
            className="bg-purple-100 p-6 rounded-lg text-center hover:bg-purple-200 cursor-pointer"
          >
            <p className="text-xl mb-2">👥</p>
            <h4 className="font-semibold">View Users</h4>
            <p className="text-gray-600 text-sm">See all registered users</p>
          </Link>
        </div>
      </div>

      {/* Upcoming Events Table */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Upcoming Events</h3>
          <Link href="/admin/events" className="text-blue-600 hover:underline text-sm">
            View All Events →
          </Link>
        </div>

        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b">
              <th className="py-2 px-4">Event</th>
              <th className="py-2 px-4">Date</th>
              <th className="py-2 px-4">Location</th>
              <th className="py-2 px-4">Available Seats</th>
              <th className="py-2 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {upcomingEvents.map(event => {
              const eventDate = new Date(event.date).toLocaleString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <tr key={event._id} className="border-b hover:bg-gray-50 transition-colors">
                  <td className="py-2 px-4">{event.title}</td>
                  <td className="py-2 px-4">{eventDate}</td>
                  <td className="py-2 px-4">{event.location}</td>
                  <td className="py-2 px-4">
                    {event.totalSeats - (event.bookedSeats || 0)} / {event.totalSeats}
                  </td>
                  <td className="py-2 px-4 flex space-x-2">
                    <Link
                      href={`/admin/events/${event._id}/edit`}
                      className="px-3 py-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors"
                    >
                      Edit
                    </Link>
                    <Link
                      href={`/admin/events/${event._id}`}
                      className="px-3 py-1 bg-green-100 text-green-600 rounded hover:bg-green-200 transition-colors"
                    >
                      View Bookings
                    </Link>
                  </td>
                </tr>
              );
            })}

            {upcomingEvents.length === 0 && (
              <tr>
                <td colSpan={5} className="py-4 px-4 text-center text-gray-500">
                  No upcoming events found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
