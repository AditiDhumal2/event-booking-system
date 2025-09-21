import Link from 'next/link';
import DeleteButton from './DeleteButton';
import { getEvents } from '@/actions/eventActions';

interface Event {
  _id: string;
  title: string;
  date: string;
  location: string;
  price: number;
  totalSeats: number;
  imageUrl?: string;
}

export default async function EventsPage() {
  const result = await getEvents();

  if (!result.success) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="p-3 bg-red-100 text-red-700 rounded-md">
          Error: {result.error}
        </div>
      </div>
    );
  }

  const events: Event[] = result.events || [];

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold text-gray-800">Manage Events</h1>
        <Link
          href="/admin/events/new"
          className="bg-blue-600 hover:bg-blue-700 text-white py-1 px-3 rounded-md text-sm"
        >
          Create Event
        </Link>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-500 mb-2">No events found.</p>
          <Link
            href="/admin/events/new"
            className="text-blue-600 hover:text-blue-800 font-medium text-sm"
          >
            Create your first event
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow">
          <table className="w-full table-auto">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 py-2 text-left text-sm text-gray-500">Image</th>
                <th className="px-2 py-2 text-left text-sm text-gray-500">Event Name</th>
                <th className="px-2 py-2 text-left text-sm text-gray-500">Date</th>
                <th className="px-2 py-2 text-left text-sm text-gray-500">Location</th>
                <th className="px-2 py-2 text-left text-sm text-gray-500">Price</th>
                <th className="px-2 py-2 text-left text-sm text-gray-500">Seats</th>
                <th className="px-2 py-2 text-left text-sm text-gray-500">Actions</th>
              </tr>
            </thead>

            <tbody>
              {events.map((event) => (
                <tr key={event._id} className="border-t border-gray-200">
                  <td className="px-2 py-2">
                    {event.imageUrl ? (
                      <img
                        src={event.imageUrl}
                        alt={event.title}
                        className="h-10 w-10 rounded-md object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 bg-gray-200 rounded-md"></div>
                    )}
                  </td>

                  <td className="px-2 py-2 text-sm text-gray-700 font-medium">{event.title}</td>
                  <td className="px-2 py-2 text-sm text-gray-500">{new Date(event.date).toLocaleDateString()}</td>
                  <td className="px-2 py-2 text-sm text-gray-500">{event.location}</td>
                  <td className="px-2 py-2 text-sm text-gray-500">₹{event.price.toLocaleString('en-IN')}</td>
                  <td className="px-2 py-2 text-sm text-gray-500">{event.totalSeats.toLocaleString('en-IN')}</td>
                  <td className="px-2 py-2 text-sm flex gap-2">
                    <Link
                      href={`/admin/events/${event._id}/edit`}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Edit
                    </Link>
                    <DeleteButton eventId={event._id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
