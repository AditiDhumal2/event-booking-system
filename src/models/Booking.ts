import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export interface IBooking extends Document {
  eventId: Types.ObjectId;
  userId: Types.ObjectId;
  tickets: number;
  totalPrice: number;
  bookingCode: string;
  status: 'confirmed' | 'cancelled';
  createdAt: Date;
}

const bookingSchema = new Schema<IBooking>({
  eventId: { 
    type: Schema.Types.ObjectId, 
    required: true,
    ref: 'Event'
  },
  userId: { 
    type: Schema.Types.ObjectId, 
    required: true,
    ref: 'User' // Make sure this matches your User model name
  },
  tickets: { type: Number, required: true },
  totalPrice: { type: Number, required: true },
  bookingCode: { type: String, required: true, unique: true },
  status: { type: String, enum: ['confirmed', 'cancelled'], default: 'confirmed' },
  createdAt: { type: Date, default: Date.now }
});

// Export both the model and the interface
export const Booking: Model<IBooking> = mongoose.models.Booking || mongoose.model<IBooking>('Booking', bookingSchema);
export default Booking;