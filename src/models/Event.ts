import { Schema, model, Document, Types } from 'mongoose';

export interface IEvent extends Document {
  title: string;
  description: string;
  location: string;
  totalSeats: number;
  availableSeats: number;
  date: Date;
  price: number;       // added
  imageUrl: string;    // use imageUrl (not image)
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
    price: { type: Number, required: true },      // added
    imageUrl: { type: String, required: true },   // fixed naming
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export const Event = model<IEvent>("Event", EventSchema);
