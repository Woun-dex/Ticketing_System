import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { BookingService, OrderDetails } from '../services/booking.service';

@Component({
  selector: 'app-booking-confirmation',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="confirmation-page">
      <div class="container">
        @if (loading()) {
          <div class="loading">
            <div class="spinner"></div>
            <p>Loading your booking...</p>
          </div>
        }

        @if (error()) {
          <div class="error-card">
            <div class="error-icon">❌</div>
            <h2>Something went wrong</h2>
            <p>{{ error() }}</p>
            <button routerLink="/events">Back to Events</button>
          </div>
        }

        @if (!loading() && !error() && order()) {
          <div class="success-card">
            <div class="success-icon">✅</div>
            <h1>Booking {{ order()?.status === 'PENDING' ? 'Reserved' : 'Confirmed' }}!</h1>
            <p class="subtitle">
              {{ order()?.status === 'PENDING' 
                ? 'Please complete your payment within 5 minutes to confirm your booking.' 
                : 'Your tickets have been confirmed.' }}
            </p>

            <div class="order-details">
              <div class="detail-row">
                <span class="label">Order ID</span>
                <span class="value">{{ order()?.id }}</span>
              </div>
              <div class="detail-row">
                <span class="label">Event ID</span>
                <span class="value">{{ order()?.eventId }}</span>
              </div>
              <div class="detail-row">
                <span class="label">Seats</span>
                <span class="value">{{ order()?.seatIds?.length }} seat(s)</span>
              </div>
              <div class="detail-row">
                <span class="label">Status</span>
                <span class="value status" [class]="order()?.status?.toLowerCase()">
                  {{ order()?.status }}
                </span>
              </div>
              <div class="detail-row total">
                <span class="label">Total Amount</span>
                <span class="value">\${{ order()?.totalAmount }}</span>
              </div>
            </div>

            @if (order()?.status === 'PENDING') {
              <button class="pay-btn" (click)="proceedToPayment()">
                💳 Proceed to Payment
              </button>
            }

            <button class="secondary-btn" routerLink="/events">
              ← Back to Events
            </button>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .confirmation-page {
      min-height: 100vh;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
    }

    .container {
      width: 100%;
      max-width: 500px;
    }

    .loading {
      text-align: center;
      color: white;
    }

    .spinner {
      width: 50px;
      height: 50px;
      border: 4px solid rgba(255,255,255,0.2);
      border-top-color: #fcc200;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .success-card, .error-card {
      background: rgba(255,255,255,0.05);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 24px;
      padding: 2.5rem;
      text-align: center;
    }

    .success-icon {
      font-size: 4rem;
      margin-bottom: 1rem;
    }

    .error-icon {
      font-size: 4rem;
      margin-bottom: 1rem;
    }

    h1 {
      color: white;
      font-size: 2rem;
      margin: 0 0 0.5rem 0;
    }

    h2 {
      color: white;
      font-size: 1.5rem;
      margin: 0 0 0.5rem 0;
    }

    .subtitle {
      color: rgba(255,255,255,0.7);
      margin-bottom: 2rem;
    }

    .order-details {
      background: rgba(0,0,0,0.2);
      border-radius: 16px;
      padding: 1.5rem;
      margin-bottom: 2rem;
    }

    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 0.75rem 0;
      border-bottom: 1px solid rgba(255,255,255,0.1);
    }

    .detail-row:last-child {
      border-bottom: none;
    }

    .detail-row.total {
      border-top: 2px solid rgba(255,255,255,0.2);
      margin-top: 0.5rem;
      padding-top: 1rem;
    }

    .label {
      color: rgba(255,255,255,0.6);
    }

    .value {
      color: white;
      font-weight: 600;
    }

    .value.status {
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.85rem;
    }

    .value.status.pending {
      background: rgba(241, 196, 15, 0.2);
      color: #f1c40f;
    }

    .value.status.confirmed, .value.status.paid {
      background: rgba(39, 174, 96, 0.2);
      color: #27ae60;
    }

    .detail-row.total .value {
      color: #fcc200;
      font-size: 1.5rem;
    }

    .pay-btn {
      width: 100%;
      padding: 1rem;
      background: linear-gradient(135deg, #fcc200 0%, #f39c12 100%);
      border: none;
      border-radius: 12px;
      color: #1a1a2e;
      font-size: 1.1rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.3s;
      margin-bottom: 1rem;
    }

    .pay-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 5px 20px rgba(252, 194, 0, 0.4);
    }

    .secondary-btn {
      width: 100%;
      padding: 1rem;
      background: transparent;
      border: 1px solid rgba(255,255,255,0.2);
      border-radius: 12px;
      color: white;
      font-size: 1rem;
      cursor: pointer;
      transition: all 0.3s;
    }

    .secondary-btn:hover {
      background: rgba(255,255,255,0.1);
    }

    .error-card button {
      margin-top: 1rem;
      padding: 1rem 2rem;
      background: #fcc200;
      border: none;
      border-radius: 12px;
      color: #1a1a2e;
      font-weight: 600;
      cursor: pointer;
    }
  `]
})
export class BookingConfirmationComponent implements OnInit {
  order = signal<OrderDetails | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private bookingService: BookingService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const orderId = params['orderId'];
      if (orderId) {
        this.loadOrder(orderId);
      }
    });
  }

  loadOrder(orderId: string): void {
    this.loading.set(true);
    this.bookingService.getOrderDetails(orderId).subscribe({
      next: (order) => {
        this.order.set(order);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load order details');
        this.loading.set(false);
        console.error(err);
      }
    });
  }

  proceedToPayment(): void {
    // Navigate to payment page
    this.router.navigate(['/payment', this.order()?.id]);
  }
}
