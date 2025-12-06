// Event Models
export interface Event {
  id: number;
  name: string;
  type: string;
  status: EventStatus;
  startTime: string;
  endTime: string;
  seatTypes: SeatType[];
}

export interface EventRequest {
  name: string;
  type: string;
  startTime: string;
  endTime: string;
}

export enum EventStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
  CANCELLED = 'CANCELLED'
}

// Seat Models
export interface SeatType {
  id: number;
  name: string;
  price: number;
}

export interface SeatTypeRequest {
  name: string;
  price: number;
}

export interface Seat {
  id: number;
  row: string;
  number: string;
  status: SeatStatus;
  typeName: string;
  price: number;
}

export enum SeatStatus {
  AVAILABLE = 'AVAILABLE',
  BLOCKED = 'BLOCKED',
  RESERVED = 'RESERVED',
  SOLD = 'SOLD'
}

export interface SeatGenerationRequest {
  seatTypeId: number;
  rowPrefix: string;
  startSeatNumber: number;
  endSeatNumber: number;
}

export interface EventInventoryResponse {
  eventId: number;
  eventName: string;
  totalSeats: number;
  availableSeats: number;
  seats: Seat[];
}

// Stats for dashboard
export interface DashboardStats {
  totalEvents: number;
  publishedEvents: number;
  draftEvents: number;
  totalSeats: number;
  soldSeats: number;
  revenue: number;
}
