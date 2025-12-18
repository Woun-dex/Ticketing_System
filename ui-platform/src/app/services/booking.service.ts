import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface BookingRequest {
  eventId: number;
  seatIds: number[];
}

export interface BookingResponse {
  orderId: string;
  status: string;
  message?: string;
}

export interface OrderDetails {
  id: string;
  userId: string;
  eventId: number;
  status: string;
  totalAmount: number;
  seatIds: number[];
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class BookingService {
  // Use gateway URL for routing through the API gateway
  private readonly API_URL = 'http://localhost:8080/api/v1/book';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  createBooking(request: BookingRequest): Observable<BookingResponse> {
    return this.http.post<BookingResponse>(
      this.API_URL,
      request,
      { headers: this.getHeaders() }
    );
  }

  getOrderDetails(orderId: string): Observable<OrderDetails> {
    return this.http.get<OrderDetails>(
      `${this.API_URL}/orders/${orderId}`,
      { headers: this.getHeaders() }
    );
  }

  cancelBooking(orderId: string): Observable<void> {
    return this.http.delete<void>(
      `${this.API_URL}/orders/${orderId}`,
      { headers: this.getHeaders() }
    );
  }
}
