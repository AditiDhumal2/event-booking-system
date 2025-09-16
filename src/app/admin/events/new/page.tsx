'use client';

import { createEvent } from '@/actions/eventActions';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewEventPage() {
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  async function handleCreate(formData: FormData) {
    setIsLoading(true);
    const result = await createEvent(formData);
    
    if (result.success) {
      setMessage('Event created successfully!');
      // Redirect to events list after a short delay
      setTimeout(() => {
        router.push('/admin/events');
      }, 1500);
    } else {
      setMessage(result.error || 'Failed to create event');
    }
    setIsLoading(false);
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Create New Event</h1>
        <p className="text-gray-600">Fill out the form below to create a new event</p>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <form action={handleCreate} className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <input 
              id="title"
              name="title" 
              placeholder="Event Title" 
              required 
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea 
              id="description"
              name="description" 
              placeholder="Event Description" 
              required 
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
              Date *
            </label>
            <input 
              id="date"
              type="date" 
              name="date" 
              required 
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
              Location *
            </label>
            <input 
              id="location"
              name="location" 
              placeholder="Event Location" 
              required 
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                Price (₹) *
              </label>
              <input 
                id="price"
                type="number" 
                name="price" 
                placeholder="0.00" 
                required 
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label htmlFor="totalSeats" className="block text-sm font-medium text-gray-700 mb-1">
                Total Seats *
              </label>
              <input 
                id="totalSeats"
                type="number" 
                name="totalSeats" 
                placeholder="100" 
                required 
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 mb-1">
              Image URL
            </label>
            <input 
              id="imageUrl"
              name="imageUrl" 
              placeholder="https://example.com/image.jpg" 
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex justify-between pt-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isLoading}
              className={`px-6 py-2 rounded-md text-white font-medium ${isLoading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'} transition-colors`}
            >
              {isLoading ? 'Creating...' : 'Create Event'}
            </button>
          </div>
        </form>
        
        {message && (
          <div className={`mt-4 p-3 rounded-md ${message.includes('successfully') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}