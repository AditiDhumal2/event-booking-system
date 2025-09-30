'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getEventById, updateEvent } from '@/actions/eventActions';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

interface EventData {
  _id: string;
  title: string;
  description: string;
  location: string;
  date: string;
  price: number;
  totalSeats: number;
  imageUrls: string[];
}

export default function EditEventPage({ params }: PageProps) {
  const [unwrappedParams, setUnwrappedParams] = useState<{ id: string } | null>(null);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [formData, setFormData] = useState<EventData>({
    _id: '',
    title: '',
    description: '',
    location: '',
    date: '',
    price: 0,
    totalSeats: 0,
    imageUrls: []
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  // Unwrap the params promise
  useEffect(() => {
    async function unwrapParams() {
      const resolvedParams = await params;
      setUnwrappedParams(resolvedParams);
    }
    unwrapParams();
  }, [params]);

  // Fetch event data after params are unwrapped
  useEffect(() => {
    async function fetchEvent() {
      if (!unwrappedParams) return;
      
      try {
        const result = await getEventById(unwrappedParams.id);
        if (result.success && result.event) {
          // Format the date for the input field (YYYY-MM-DD)
          const eventDate = new Date(result.event.date);
          const formattedDate = eventDate.toISOString().split('T')[0];
          
          setFormData({
            _id: result.event._id,
            title: result.event.title,
            description: result.event.description,
            location: result.event.location,
            date: formattedDate,
            price: result.event.price,
            totalSeats: result.event.totalSeats,
            imageUrls: result.event.imageUrls || []
          });
        } else {
          setMessage(result.error || 'Failed to load event');
        }
      } catch (error) {
        setMessage('Failed to load event');
        console.error('Error fetching event:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchEvent();
  }, [unwrappedParams]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'price' || name === 'totalSeats' ? Number(value) : value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(files);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      imageUrls: prev.imageUrls.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unwrappedParams) return;
    
    setIsSubmitting(true);
    setMessage(null);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('location', formData.location);
      formDataToSend.append('date', formData.date);
      formDataToSend.append('price', formData.price.toString());
      formDataToSend.append('totalSeats', formData.totalSeats.toString());

      // Append existing image URLs
      formData.imageUrls.forEach(url => {
        formDataToSend.append('existingImages', url);
      });

      // Append new files
      selectedFiles.forEach((file) => {
        formDataToSend.append('images', file);
      });

      const result = await updateEvent(unwrappedParams.id, formDataToSend);
      
      if (result.success) {
        setMessage('Event updated successfully!');
        // Redirect to events list after a short delay
        setTimeout(() => {
          router.push('/admin/events');
        }, 1500);
      } else {
        setMessage(result.error || 'Failed to update event');
      }
    } catch (error) {
      setMessage('Failed to update event');
      console.error('Error updating event:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="text-blue-600 hover:text-blue-800 mb-4 inline-flex items-center"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back
        </button>
        
        <h1 className="text-2xl font-bold text-gray-800">Edit Event</h1>
        <p className="text-gray-600">Update the event details below</p>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <input 
              id="title"
              name="title" 
              type="text"
              value={formData.title}
              onChange={handleInputChange}
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
              value={formData.description}
              onChange={handleInputChange}
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
              value={formData.date}
              onChange={handleInputChange}
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
              type="text"
              value={formData.location}
              onChange={handleInputChange}
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
                value={formData.price}
                onChange={handleInputChange}
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
                value={formData.totalSeats}
                onChange={handleInputChange}
                placeholder="100" 
                required 
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Existing Images */}
          {formData.imageUrls.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Existing Images ({formData.imageUrls.length})
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {formData.imageUrls.map((url, index) => (
                  <div key={index} className="relative group">
                    <div className="relative h-32 w-full overflow-hidden rounded-lg border border-gray-300">
                      <img 
                        src={url} 
                        alt={`Existing image ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeExistingImage(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    <div className="text-xs text-gray-500 text-center mt-1">Image {index + 1}</div>
                  </div>
                ))}
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Click the × button to remove images
              </p>
            </div>
          )}
          
          {/* Add New Images */}
          <div>
            <label htmlFor="images" className="block text-sm font-medium text-gray-700 mb-1">
              Add New Images
            </label>
            <input 
              id="images"
              type="file" 
              multiple
              accept="image/*"
              onChange={handleFileChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-sm text-gray-500 mt-1">
              You can select multiple images. Supported formats: JPG, PNG, WebP (Max 5MB each)
            </p>
          </div>

          {/* Selected New Files Preview */}
          {selectedFiles.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">New Images to Upload ({selectedFiles.length}):</h3>
              <div className="space-y-2">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-blue-50 rounded-md">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-200 rounded flex items-center justify-center">
                        <span className="text-xs text-blue-700">NEW</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">{file.name}</p>
                        <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="text-red-500 hover:text-red-700 text-sm font-medium"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
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
              disabled={isSubmitting}
              className={`px-6 py-2 rounded-md text-white font-medium ${
                isSubmitting ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
              } transition-colors`}
            >
              {isSubmitting ? 'Updating...' : 'Update Event'}
            </button>
          </div>
        </form>
        
        {message && (
          <div className={`mt-4 p-3 rounded-md ${
            message.includes('successfully') 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}