'use client';

import { createEvent } from '@/actions/eventActions';
import { getCategories } from '@/actions/categoryActions';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Category {
  _id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  isActive: boolean;
}

export default function NewEventPage() {
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const router = useRouter();

  // Load categories on component mount
  useEffect(() => {
    async function loadCategories() {
      try {
        const result = await getCategories();
        if (result.success && result.categories) {
          setCategories(result.categories);
        } else {
          setMessage('Failed to load categories');
        }
      } catch (error) {
        console.error('Error loading categories:', error);
        setMessage('Error loading categories');
      } finally {
        setCategoriesLoading(false);
      }
    }

    loadCategories();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(files);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  async function handleSubmit(formData: FormData) {
    setIsLoading(true);
    setMessage(null);
    
    try {
      const submitData = new FormData();
      
      // Add all form fields
      submitData.append('title', formData.get('title') as string);
      submitData.append('description', formData.get('description') as string);
      submitData.append('location', formData.get('location') as string);
      submitData.append('date', formData.get('date') as string);
      submitData.append('time', formData.get('time') as string);
      submitData.append('price', formData.get('price') as string);
      submitData.append('totalSeats', formData.get('totalSeats') as string);
      submitData.append('category', formData.get('category') as string);
      
      // Append each selected file
      selectedFiles.forEach((file) => {
        submitData.append('images', file);
      });

      console.log('Submitting form with category:', formData.get('category'));
      
      const result = await createEvent(submitData);
      
      if (result.success) {
        setMessage('Event created successfully!');
        setTimeout(() => {
          router.push('/admin/events');
        }, 1500);
      } else {
        setMessage(result.error || 'Failed to create event');
      }
    } catch (error) {
      console.error('Form submission error:', error);
      setMessage('An error occurred while creating the event');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Create New Event</h1>
        <p className="text-gray-600">Fill out the form below to create a new event</p>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <form action={handleSubmit} className="space-y-4">
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
          
          {/* Dynamic Category Field */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              Category *
            </label>
            {categoriesLoading ? (
              <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 animate-pulse">
                Loading categories...
              </div>
            ) : categories.length > 0 ? (
              <select 
                id="category"
                name="category" 
                required 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a category</option>
                {categories.map(category => (
                  <option key={category._id} value={category.name}>
                    {category.name}
                  </option>
                ))}
              </select>
            ) : (
              <div className="text-red-600 text-sm">
                No categories available. Please create categories first.
              </div>
            )}
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
          
          <div className="grid grid-cols-2 gap-4">
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
              <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-1">
                Time *
              </label>
              <input 
                id="time"
                type="time" 
                name="time" 
                required 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
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
          
          {/* File Upload Section */}
          <div>
            <label htmlFor="images" className="block text-sm font-medium text-gray-700 mb-1">
              Event Images *
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

          {/* Selected Files Preview */}
          {selectedFiles.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Selected Images ({selectedFiles.length}):</h3>
              <div className="space-y-2">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                        <span className="text-xs text-gray-500">IMG</span>
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
              disabled={isLoading || selectedFiles.length === 0 || categories.length === 0}
              className={`px-6 py-2 rounded-md text-white font-medium ${
                isLoading || selectedFiles.length === 0 || categories.length === 0
                  ? 'bg-blue-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700'
              } transition-colors`}
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