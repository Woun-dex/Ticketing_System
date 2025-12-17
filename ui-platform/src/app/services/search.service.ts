import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface SeatDocument {
  id: string;
  eventId: number;
  rowNumber: string;
  seatNumber: string;
  status: string;
  seatTypeName: string;
  price: number;
}

export interface EventDocument {
  id: string;
  name: string;
  type: string;
  status: string;
  startTime: string;
  endTime: string;
  totalSeats: number;
  availableSeats: number;
}

export interface SearchResponse {
  eventId: number;
  eventName: string;
  eventType: string;
  totalSeats: number;
  availableSeats: number;
  seats: SeatDocument[];
}

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  private readonly API_URL = 'http://localhost:8080/api/v1/search';

  constructor(private http: HttpClient) {}

  searchByEventId(eventId: number): Observable<SearchResponse> {
    return this.http.get<SearchResponse>(`${this.API_URL}/${eventId}`);
  }

  searchEvents(query?: string): Observable<EventDocument[]> {
    const params = query ? `?query=${encodeURIComponent(query)}` : '';
    return this.http.get<EventDocument[]>(`${this.API_URL}/events${params}`);
  }

  searchEventsByType(type: string): Observable<EventDocument[]> {
    return this.http.get<EventDocument[]>(`${this.API_URL}/events/type/${type}`);
  }

  getAvailableEvents(): Observable<EventDocument[]> {
    return this.http.get<EventDocument[]>(`${this.API_URL}/events/available`);
  }

  getSeatsByEventId(eventId: number): Observable<SeatDocument[]> {
    return this.http.get<SeatDocument[]>(`${this.API_URL}/seats/${eventId}`);
  }

  getAvailableSeatsByEventId(eventId: number): Observable<SeatDocument[]> {
    return this.http.get<SeatDocument[]>(`${this.API_URL}/seats/${eventId}/available`);
  }
}
