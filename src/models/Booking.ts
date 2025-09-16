import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IBooking extends Document {
  eventId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  tickets: number;
  totalPrice: number;
  bookingCode: string;
  status: 'confirmed' | 'cancelled';
  createdAt: Date;
}

const bookingSchema = new Schema<IBooking>({
  eventId: { type: Schema.Types.ObjectId, required: true },
  userId: { type: Schema.Types.ObjectId, required: true },
  tickets: { type: Number, required: true },
  totalPrice: { type: Number, required: true },
  bookingCode: { type: String, required: true, unique: true },
  status: { type: String, enum: ['confirmed', 'cancelled'], default: 'confirmed' },
  createdAt: { type: Date, default: Date.now }
});

// Export both the model and the interface
export const Booking: Model<IBooking> = mongoose.models.Booking || mongoose.model<IBooking>('Booking', bookingSchema);
export default Booking;