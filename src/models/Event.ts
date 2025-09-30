import { Schema, model, Document, Types, models } from "mongoose";

export interface IEvent extends Document {
  _id: Types.ObjectId;
  title: string;
  description: string;
  location: string;
  totalSeats: number;
  availableSeats: number;
  date: Date;
  price: number;
  imageUrls: string[];
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
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
    imageUrls: { type: [String], required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export const Event = models.Event || model<IEvent>("Event", EventSchema);
export default Event;