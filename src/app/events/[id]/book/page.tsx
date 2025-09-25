'use client';

import { createBooking } from '@/actions/bookingActions';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface BookEventPageProps {
  params: { id: string };
}

export default function BookEventPage({ params }: BookEventPageProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleBooking(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);

    try {
      const result = await createBooking(params.id, formData);
      if (result.success) {
        router.push(`/user/bookings?booking=success`);
      } else {
        setError(result.error || 'Booking failed');
      }
    } catch (err: any) {
      setError(err.message || 'Booking failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-50">
      <form
        onSubmit={handleBooking}
        className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md"
      >
        <h1 className="text-2xl font-bold mb-6">Book Event</h1>

        {error && <p className="mb-4 text-red-600 font-medium">{error}</p>}

        <label className="block mb-4">
          <span className="text-gray-700 font-medium">Number of Tickets</span>
          <input
            type="number"
            name="tickets"
            min={1}
            defaultValue={1}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
        >
          {loading ? 'Booking...' : 'Book Now'}
        </button>
      </form>
    </div>
  );
}
