'use server';

import dbConnect from '@/lib/mongoose';
import { requireAuth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

async function getCategoryModel() {
  await dbConnect();
  const { Category } = await import('@/models/Category');
  return Category;
}

// Get all active categories
export async function getCategories() {
  try {
    const Category = await getCategoryModel();
    const categories = await Category.find({ isActive: true }).sort({ name: 1 });
    
    return {
      success: true,
      categories: categories.map(cat => ({
        _id: cat._id.toString(),
        name: cat.name,
        description: cat.description,
        color: cat.color,
        icon: cat.icon,
        isActive: cat.isActive
      }))
    };
  } catch (error) {
    console.error('Error fetching categories:', error);
    return { success: false, error: 'Failed to fetch categories' };
  }
}

// Get all categories (including inactive - for admin)
export async function getAllCategories() {
  try {
    const Category = await getCategoryModel();
    const categories = await Category.find().sort({ name: 1 });
    
    return {
      success: true,
      categories: categories.map(cat => ({
        _id: cat._id.toString(),
        name: cat.name,
        description: cat.description,
        color: cat.color,
        icon: cat.icon,
        isActive: cat.isActive
      }))
    };
  } catch (error) {
    console.error('Error fetching all categories:', error);
    return { success: false, error: 'Failed to fetch categories' };
  }
}

// Create new category
export async function createCategory(formData: FormData) {
  try {
    await requireAuth();
    
    const Category = await getCategoryModel();
    
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const color = formData.get('color') as string;
    const icon = formData.get('icon') as string;

    // Check if category already exists
    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
      return { success: false, error: 'Category with this name already exists' };
    }

    const category = new Category({
      name,
      description,
      color: color || '#3B82F6',
      icon: icon || '🎯'
    });

    await category.save();

    revalidatePath('/admin/categories');
    revalidatePath('/user/home');
    revalidatePath('/admin/events/new');
    revalidatePath('/admin/events/edit');

    return { success: true, message: 'Category created successfully' };
  } catch (error) {
    console.error('Category creation error:', error);
    return { success: false, error: 'Failed to create category' };
  }
}

// Update category
export async function updateCategory(categoryId: string, formData: FormData) {
  try {
    await requireAuth();
    
    const Category = await getCategoryModel();
    
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const color = formData.get('color') as string;
    const icon = formData.get('icon') as string;
    const isActive = formData.get('isActive') === 'true';

    // Check if category name is taken by another category
    const existingCategory = await Category.findOne({ name, _id: { $ne: categoryId } });
    if (existingCategory) {
      return { success: false, error: 'Category with this name already exists' };
    }

    const updatedCategory = await Category.findByIdAndUpdate(
      categoryId,
      {
        name,
        description,
        color,
        icon,
        isActive
      },
      { new: true }
    );

    if (!updatedCategory) {
      return { success: false, error: 'Category not found' };
    }

    revalidatePath('/admin/categories');
    revalidatePath('/user/home');
    revalidatePath('/admin/events/new');
    revalidatePath('/admin/events/edit');

    return { success: true, message: 'Category updated successfully' };
  } catch (error) {
    console.error('Category update error:', error);
    return { success: false, error: 'Failed to update category' };
  }
}

// Delete category
export async function deleteCategory(categoryId: string) {
  try {
    await requireAuth();
    
    const Category = await getCategoryModel();

    // Check if any events are using this category
    const { Event } = await import('@/models/Event');
    const category = await Category.findById(categoryId);
    if (!category) {
      return { success: false, error: 'Category not found' };
    }

    const eventsUsingCategory = await Event.countDocuments({ category: category.name });
    
    if (eventsUsingCategory > 0) {
      return { success: false, error: 'Cannot delete category. There are events using this category.' };
    }

    await Category.findByIdAndDelete(categoryId);

    revalidatePath('/admin/categories');
    revalidatePath('/user/home');
    revalidatePath('/admin/events/new');
    revalidatePath('/admin/events/edit');

    return { success: true, message: 'Category deleted successfully' };
  } catch (error) {
    console.error('Category deletion error:', error);
    return { success: false, error: 'Failed to delete category' };
  }
}

// Toggle category status
export async function toggleCategoryStatus(categoryId: string) {
  try {
    await requireAuth();
    
    const Category = await getCategoryModel();

    const category = await Category.findById(categoryId);
    if (!category) {
      return { success: false, error: 'Category not found' };
    }

    category.isActive = !category.isActive;
    await category.save();

    revalidatePath('/admin/categories');
    revalidatePath('/user/home');
    revalidatePath('/admin/events/new');
    revalidatePath('/admin/events/edit');

    return { 
      success: true, 
      message: `Category ${category.isActive ? 'activated' : 'deactivated'} successfully` 
    };
  } catch (error) {
    console.error('Category status toggle error:', error);
    return { success: false, error: 'Failed to update category status' };
  }
}