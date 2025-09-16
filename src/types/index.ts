// types/mongoose.d.ts or types/index.ts
import { Document, Types } from 'mongoose';

export interface IUser {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password: string;
  role: 'user' | 'admin';
  createdAt: Date;
  updatedAt: Date;
}

export interface IEvent {
  _id: Types.ObjectId;
  title: string;
  description: string;
  location: string;
  date: Date;
  price: number;
  totalSeats: number;
  availableSeats: number;
  imageUrl: string;
  createdBy: Types.ObjectId | IUser;
  createdAt: Date;
  updatedAt: Date;
}

// Plain object versions for client-side use
export interface EventPlain {
  _id: string;
  title: string;
  description: string;
  location: string;
  date: string;
  price: number;
  totalSeats: number;
  availableSeats: number;
  imageUrl: string;
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface UserPlain {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  createdAt: string;
  updatedAt: string;
}