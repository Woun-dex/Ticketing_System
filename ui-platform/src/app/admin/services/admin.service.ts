import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import {
  Event,
  EventRequest,
  SeatType,
  SeatTypeRequest,
  SeatGenerationRequest,
  EventInventoryResponse,
  Seat,
  SeatStatus
} from '../models/admin.models';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private readonly API_URL = 'http://localhost:8082/api/v1/admin/events';
  
  private eventsSignal = signal<Event[]>([]);
  private selectedEventSignal = signal<Event | null>(null);
  private inventorySignal = signal<EventInventoryResponse | null>(null);
  private loadingSignal = signal<boolean>(false);
  private errorSignal = signal<string | null>(null);

  readonly events = this.eventsSignal.asReadonly();
  readonly selectedEvent = this.selectedEventSignal.asReadonly();
  readonly inventory = this.inventorySignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getHeaders(): HttpHeaders {
    const token = this.authService.token();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  // Event CRUD Operations
  createEvent(request: EventRequest): Observable<Event> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    
    return this.http.post<Event>(this.API_URL, request, { headers: this.getHeaders() }).pipe(
      tap((event) => {
        this.eventsSignal.update(events => [...events, event]);
        this.loadingSignal.set(false);
      }),
      catchError((error) => {
        this.loadingSignal.set(false);
        this.errorSignal.set(error.error?.message || 'Failed to create event');
        return throwError(() => error);
      })
    );
  }

  updateEvent(id: number, request: EventRequest): Observable<Event> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    
    return this.http.put<Event>(`${this.API_URL}/${id}`, request, { headers: this.getHeaders() }).pipe(
      tap((event) => {
        this.eventsSignal.update(events => 
          events.map(e => e.id === id ? event : e)
        );
        this.selectedEventSignal.set(event);
        this.loadingSignal.set(false);
      }),
      catchError((error) => {
        this.loadingSignal.set(false);
        this.errorSignal.set(error.error?.message || 'Failed to update event');
        return throwError(() => error);
      })
    );
  }

  getEvent(id: number): Observable<Event> {
    this.loadingSignal.set(true);
    
    return this.http.get<Event>(`${this.API_URL}/${id}`, { headers: this.getHeaders() }).pipe(
      tap((event) => {
        this.selectedEventSignal.set(event);
        this.loadingSignal.set(false);
      }),
      catchError((error) => {
        this.loadingSignal.set(false);
        this.errorSignal.set(error.error?.message || 'Failed to fetch event');
        return throwError(() => error);
      })
    );
  }

  getAllEvents(): Observable<Event[]> {
    this.loadingSignal.set(true);
    
    return this.http.get<Event[]>(this.API_URL, { headers: this.getHeaders() }).pipe(
      tap((events) => {
        this.eventsSignal.set(events);
        this.loadingSignal.set(false);
      }),
      catchError((error) => {
        this.loadingSignal.set(false);
        this.errorSignal.set(error.error?.message || 'Failed to fetch events');
        return throwError(() => error);
      })
    );
  }

  deleteEvent(id: number): Observable<void> {
    this.loadingSignal.set(true);
    
    return this.http.delete<void>(`${this.API_URL}/${id}`, { headers: this.getHeaders() }).pipe(
      tap(() => {
        this.eventsSignal.update(events => events.filter(e => e.id !== id));
        this.loadingSignal.set(false);
      }),
      catchError((error) => {
        this.loadingSignal.set(false);
        this.errorSignal.set(error.error?.message || 'Failed to delete event');
        return throwError(() => error);
      })
    );
  }

  // Seat Type Operations
  addSeatType(eventId: number, request: SeatTypeRequest): Observable<SeatType> {
    this.loadingSignal.set(true);
    
    return this.http.post<SeatType>(
      `${this.API_URL}/${eventId}/seat-types`, 
      request, 
      { headers: this.getHeaders() }
    ).pipe(
      tap((seatType) => {
        // Update the event with new seat type
        const currentEvent = this.selectedEventSignal();
        if (currentEvent && currentEvent.id === eventId) {
          this.selectedEventSignal.set({
            ...currentEvent,
            seatTypes: [...(currentEvent.seatTypes || []), seatType]
          });
        }
        this.loadingSignal.set(false);
      }),
      catchError((error) => {
        this.loadingSignal.set(false);
        this.errorSignal.set(error.error?.message || 'Failed to add seat type');
        return throwError(() => error);
      })
    );
  }

  // Seat Operations
  generateSeats(eventId: number, request: SeatGenerationRequest): Observable<string> {
    this.loadingSignal.set(true);
    
    return this.http.post<string>(
      `${this.API_URL}/${eventId}/seats/generate`, 
      request, 
      { headers: this.getHeaders(), responseType: 'text' as 'json' }
    ).pipe(
      tap(() => {
        this.loadingSignal.set(false);
        // Refresh inventory after generating seats
        this.getEventInventory(eventId).subscribe();
      }),
      catchError((error) => {
        this.loadingSignal.set(false);
        this.errorSignal.set(error.error?.message || 'Failed to generate seats');
        return throwError(() => error);
      })
    );
  }

  getEventInventory(eventId: number): Observable<EventInventoryResponse> {
    this.loadingSignal.set(true);
    
    return this.http.get<EventInventoryResponse>(
      `${this.API_URL}/${eventId}/inventory`, 
      { headers: this.getHeaders() }
    ).pipe(
      tap((inventory) => {
        this.inventorySignal.set(inventory);
        this.loadingSignal.set(false);
      }),
      catchError((error) => {
        this.loadingSignal.set(false);
        this.errorSignal.set(error.error?.message || 'Failed to fetch inventory');
        return throwError(() => error);
      })
    );
  }

  updateSeatStatus(seatId: number, status: SeatStatus): Observable<Seat> {
    this.loadingSignal.set(true);
    
    return this.http.put<Seat>(
      `${this.API_URL}/seats/${seatId}?status=${status}`, 
      null,
      { headers: this.getHeaders() }
    ).pipe(
      tap((seat) => {
        // Update the seat in inventory
        const currentInventory = this.inventorySignal();
        if (currentInventory) {
          this.inventorySignal.set({
            ...currentInventory,
            seats: currentInventory.seats.map(s => s.id === seatId ? seat : s)
          });
        }
        this.loadingSignal.set(false);
      }),
      catchError((error) => {
        this.loadingSignal.set(false);
        this.errorSignal.set(error.error?.message || 'Failed to update seat status');
        return throwError(() => error);
      })
    );
  }

  // Publish Event
  publishEvent(eventId: number): Observable<string> {
    this.loadingSignal.set(true);
    
    return this.http.post<string>(
      `${this.API_URL}/${eventId}/publish`, 
      null,
      { headers: this.getHeaders(), responseType: 'text' as 'json' }
    ).pipe(
      tap(() => {
        // Update event status locally
        this.eventsSignal.update(events => 
          events.map(e => e.id === eventId ? { ...e, status: 'PUBLISHED' as any } : e)
        );
        const currentEvent = this.selectedEventSignal();
        if (currentEvent && currentEvent.id === eventId) {
          this.selectedEventSignal.set({ ...currentEvent, status: 'PUBLISHED' as any });
        }
        this.loadingSignal.set(false);
      }),
      catchError((error) => {
        this.loadingSignal.set(false);
        this.errorSignal.set(error.error?.message || 'Failed to publish event');
        return throwError(() => error);
      })
    );
  }

  // Helper methods
  clearError(): void {
    this.errorSignal.set(null);
  }

  clearSelectedEvent(): void {
    this.selectedEventSignal.set(null);
    this.inventorySignal.set(null);
  }
}
