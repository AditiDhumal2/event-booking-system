import { Schema, model, Document, Types, models } from "mongoose";

export interface IEvent extends Document {
  title: string;
  description: string;
  location: string;
  totalSeats: number;
  availableSeats: number;
  date: Date;
  price: number;
  imageUrl: string;
  createdBy: Types.ObjectId;
  _id: Types.ObjectId;
}

const EventSchema = new Schema<IEvent>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    location: { type: String, required: true },
    totalSeats: { type: Number, required: true },
    availableSeats: { type: Number, required: true },
    date: { type: Date, required: true },
    price: { type: Number, required: true },
    imageUrl: { type: String, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

// ✅ Use models.Event if it exists to prevent recompilation issues
export const Event = models.Event || model<IEvent>("Event", EventSchema);
export default Event;
