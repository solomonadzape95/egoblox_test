export interface Route {
  routeId: string;
  origin: string;
  destination: string;
  price: number;
  duration: string;
  image: string;
  description: string;
  distance: string;
  buses: Bus[];
}
export interface Booking {
  bookingId: number | string;
  userId: string;
  user: {
    userName: string;
    fullName: string;
    phone: string;
  }[];
  busId: number | string;
  bus: {
    busNumber: string;
    busModel: string;
  }[];
  routeId: number | string;
  routes: {
    origin: string;
    destination: string;
    duration: string;
    description: string;
  }[];
  seatNumber: number | string;
  completed: boolean;
  checkedIn: boolean;
  bookingDate: string;
  telegramUserId?: number;
  paymentStatus: 'pending' | 'completed' | 'failed';
  paymentMethod?: 'bank_transfer' | 'paystack';
  paymentReference?: string;
}
// Define types for the data models from API
export interface Bus {
  busId: string;
  routeId: string | number;
  routes: Route[];
  busNumber: string | null;
  busModel: string;
  capacity: number;
  seatsRemaining: number;
  bookedSeats: number[];
  availableSeats: number[];
  departureTime: string;
  arrivalTime: string;
}

export interface BookingDetails {
  bookingId: string;
  busId: string;
  routeId: string;
  userId: string;
  seatNumber: string;
  completed: boolean;
  checkedIn: boolean;
  createdAt: string;
}

// Define search parameters for routes
export interface RouteSearchParams {
  origin?: string;
  destination?: string;
}

export interface BusRoute {
  id: string;
  company: string;
  logo: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  stops: number;
  price: number;
  available_seats: number;
  originCity: string;
  destinationCity: string;
}

export interface DateInfo {
  day: string;
  date: string;
  fullDate: Date;
}

export interface AppliedFilters {
  price: number[];
  stops: number[];
  sortBy: "lowest" | "highest" | null;
}

export type SeatStatus = "available" | "occupied" | "selected";

export interface Seat {
  id: string;
  status: SeatStatus;
  price: number;
  type: "standard" | "premium" | "business";
}

export interface BookingFormData {
  from: string;
  to: string;
  date: Date | undefined;
  returnDate: Date | undefined;
  passengers: number;
  name: string;
  email: string;
  phone: string;
  organization: string;
  specialRequests: string;
}

// Add TelegramUser interface
export interface TelegramUser {
  id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
}

// Add PaymentDetails interface
export interface PaymentDetails {
  amount: number;
  reference: string;
  email: string;
  paymentMethod: 'bank_transfer' | 'paystack';
  metadata: {
    bookingId: string;
    telegramUserId: number;
  };
}
