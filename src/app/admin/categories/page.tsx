'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAllCategories, createCategory, updateCategory, deleteCategory, toggleCategoryStatus } from '@/actions/categoryActions';

interface Category {
  _id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  isActive: boolean;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3B82F6',
    icon: '🎯'
  });
  const router = useRouter();

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const result = await getAllCategories();
      if (result.success && result.categories) {
        setCategories(result.categories);
      } else {
        setMessage(result.error || 'Failed to load categories');
      }
    } catch (error) {
      setMessage('Error loading categories');
      console.error('Error loading categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('color', formData.color);
      formDataToSend.append('icon', formData.icon);

      let result;
      if (editingCategory) {
        result = await updateCategory(editingCategory._id, formDataToSend);
      } else {
        result = await createCategory(formDataToSend);
      }

      if (result.success) {
        setMessage(result.message || 'Category saved successfully!');
        setFormData({ name: '', description: '', color: '#3B82F6', icon: '🎯' });
        setShowForm(false);
        setEditingCategory(null);
        await loadCategories(); // Reload categories
      } else {
        setMessage(result.error || 'Failed to save category');
      }
    } catch (error) {
      setMessage('Error saving category');
      console.error('Error saving category:', error);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description,
      color: category.color,
      icon: category.icon
    });
    setShowForm(true);
  };

  const handleDelete = async (categoryId: string) => {
    if (!confirm('Are you sure you want to delete this category? This action cannot be undone.')) return;

    try {
      const result = await deleteCategory(categoryId);
      if (result.success) {
        setMessage(result.message || 'Category deleted successfully!');
        await loadCategories();
      } else {
        setMessage(result.error || 'Failed to delete category');
      }
    } catch (error) {
      setMessage('Error deleting category');
      console.error('Error deleting category:', error);
    }
  };

  const handleToggleStatus = async (categoryId: string) => {
    try {
      const result = await toggleCategoryStatus(categoryId);
      if (result.success) {
        setMessage(result.message || 'Category status updated!');
        await loadCategories();
      } else {
        setMessage(result.error || 'Failed to update category status');
      }
    } catch (error) {
      setMessage('Error updating category status');
      console.error('Error updating category status:', error);
    }
  };

  const cancelEdit = () => {
    setShowForm(false);
    setEditingCategory(null);
    setFormData({ name: '', description: '', color: '#3B82F6', icon: '🎯' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Category Management</h1>
              <p className="text-gray-600">Manage event categories for your application</p>
            </div>
            <button
              onClick={() => router.push('/admin/events')}
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
            >
              Back to Events
            </button>
          </div>
        </div>

        {/* Message Alert */}
        {message && (
          <div className={`mb-6 p-4 rounded-md ${
            message.includes('successfully') ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'
          }`}>
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Categories List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">
                  Categories ({categories.length})
                </h2>
                <button
                  onClick={() => setShowForm(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <span>+</span>
                  <span>Add Category</span>
                </button>
              </div>

              {categories.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                  <div className="text-gray-400 text-6xl mb-4">🎯</div>
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">No Categories Yet</h3>
                  <p className="text-gray-500 mb-4">Create your first category to get started</p>
                  <button
                    onClick={() => setShowForm(true)}
                    className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Create First Category
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {categories.map((category) => (
                    <div key={category._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                      <div className="flex items-center space-x-4 flex-1">
                        <div 
                          className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg shadow-md"
                          style={{ backgroundColor: category.color }}
                        >
                          {category.icon}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="font-semibold text-gray-800">{category.name}</h3>
                            <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                              category.isActive 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {category.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">{category.description}</p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleToggleStatus(category._id)}
                          className={`px-3 py-1 text-sm rounded transition-colors ${
                            category.isActive 
                              ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' 
                              : 'bg-green-100 text-green-800 hover:bg-green-200'
                          }`}
                        >
                          {category.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleEdit(category)}
                          className="bg-blue-100 text-blue-800 px-3 py-1 text-sm rounded hover:bg-blue-200 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(category._id)}
                          className="bg-red-100 text-red-800 px-3 py-1 text-sm rounded hover:bg-red-200 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Category Form */}
          {(showForm || editingCategory) && (
            <div className="bg-white rounded-lg shadow-md p-6 h-fit sticky top-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Category Name *
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Music & Concerts"
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    Description *
                  </label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    required
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Describe what type of events belong to this category"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="color" className="block text-sm font-medium text-gray-700 mb-1">
                      Color
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        id="color"
                        type="color"
                        value={formData.color}
                        onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                        className="w-full h-10 px-1 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="icon" className="block text-sm font-medium text-gray-700 mb-1">
                      Icon (Emoji)
                    </label>
                    <input
                      id="icon"
                      type="text"
                      value={formData.icon}
                      onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., 🎵, ⚽, 🎨"
                      maxLength={2}
                    />
                  </div>
                </div>

                <div className="flex space-x-3 pt-4 border-t border-gray-200">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors font-medium"
                  >
                    {editingCategory ? 'Update Category' : 'Create Category'}
                  </button>
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}