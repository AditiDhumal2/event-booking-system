export interface IEvent {
  _id: string;
  title: string;
  description: string;
  location: string;
  date: Date;
  price: number;
  totalSeats: number;
  availableSeats: number;
}

export interface IBooking {
  _id: string;
  userId: string;
  eventId: IEvent;
  tickets: number;
  totalPrice: number;
  bookingCode: string;
  status: 'confirmed' | 'cancelled' | 'pending';
  createdAt: Date;
  updatedAt: Date;
}

export interface BookingsResponse {
  success: boolean;
  bookings?: IBooking[];
  error?: string;
}