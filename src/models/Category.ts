import mongoose from 'mongoose';

export interface ICategory extends mongoose.Document {
  name: string;
  description: string;
  color: string;
  icon: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  description: {
    type: String,
    required: true
  },
  color: {
    type: String,
    default: '#3B82F6' // Default blue color
  },
  icon: {
    type: String,
    default: '🎯'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

export const Category = mongoose.models.Category || mongoose.model<ICategory>('Category', CategorySchema);