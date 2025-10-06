import mongoose from 'mongoose';

export interface IEvent extends mongoose.Document {
  title: string;
  description: string;
  category: string; // Now this will reference category name
  tags: string[];
  location: string;
  date: Date;
  time: string;
  totalSeats: number;
  availableSeats: number;
  price: number;
  image: string;
  imageUrls: string[];
  organizer: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const EventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  description: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
    index: true
  },
  tags: [{
    type: String,
    index: true
  }],
  location: {
    type: String,
    required: true,
    index: true
  },
  date: {
    type: Date,
    required: true,
  },
  time: {
    type: String,
    required: true,
  },
  totalSeats: {
    type: Number,
    required: true,
  },
  availableSeats: {
    type: Number,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  image: {
    type: String,
    default: ''
  },
  imageUrls: [{
    type: String,
    default: []
  }],
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Create text index for search
EventSchema.index({
  title: 'text',
  description: 'text',
  category: 'text',
  tags: 'text',
  location: 'text'
});

export const Event = mongoose.models.Event || mongoose.model<IEvent>('Event', EventSchema);