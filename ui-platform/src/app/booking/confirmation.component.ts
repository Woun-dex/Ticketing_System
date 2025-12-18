import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { BookingService, OrderDetails } from '../services/booking.service';

@Component({
  selector: 'app-booking-confirmation',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="page-gradient-radial flex items-center justify-center p-4">
      <div class="w-full max-w-lg">
        @if (loading()) {
          <div class="text-center fade-in">
            <div class="spinner mx-auto mb-4"></div>
            <p class="text-gray-400">Loading your booking...</p>
          </div>
        }

        @if (error()) {
          <div class="glass-card p-8 text-center slide-up" style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3);">
            <div class="inline-flex items-center justify-center w-20 h-20 bg-red-500/20 rounded-full mb-6">
              <svg class="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </div>
            <h2 class="text-2xl font-bold text-white mb-2">Something went wrong</h2>
            <p class="text-red-400 mb-6">{{ error() }}</p>
            <a routerLink="/events" class="btn-primary">Back to Events</a>
          </div>
        }

        @if (!loading() && !error() && order()) {
          <div class="glass-card p-8 text-center slide-up">
            <!-- Success Icon -->
            <div class="inline-flex items-center justify-center w-20 h-20 rounded-full mb-6"
                 [class]="order()?.status === 'PENDING' ? 'bg-amber-500/20' : 'bg-emerald-500/20'">
              @if (order()?.status === 'PENDING') {
                <svg class="w-10 h-10 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              } @else {
                <svg class="w-10 h-10 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              }
            </div>

            <h1 class="text-3xl font-bold text-white mb-2">
              Booking {{ order()?.status === 'PENDING' ? 'Reserved' : 'Confirmed' }}!
            </h1>
            <p class="text-gray-400 mb-8">
              {{ order()?.status === 'PENDING' 
                ? 'Please complete your payment within 5 minutes to confirm your booking.' 
                : 'Your tickets have been confirmed.' }}
            </p>

            <!-- Order Details Card -->
            <div class="bg-gray-800/50 rounded-xl p-6 mb-6 text-left">
              <div class="flex justify-between items-center py-3 border-b border-gray-700/50">
                <span class="text-gray-400">Order ID</span>
                <span class="text-white font-mono font-semibold">{{ order()?.id }}</span>
              </div>
              <div class="flex justify-between items-center py-3 border-b border-gray-700/50">
                <span class="text-gray-400">Event ID</span>
                <span class="text-white font-semibold">{{ order()?.eventId }}</span>
              </div>
              <div class="flex justify-between items-center py-3 border-b border-gray-700/50">
                <span class="text-gray-400">Seats</span>
                <span class="text-white font-semibold">{{ order()?.seatIds?.length }} seat(s)</span>
              </div>
              <div class="flex justify-between items-center py-3 border-b border-gray-700/50">
                <span class="text-gray-400">Status</span>
                <span class="px-3 py-1 rounded-full text-sm font-semibold"
                      [class]="order()?.status === 'PENDING' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'">
                  {{ order()?.status }}
                </span>
              </div>
              <div class="flex justify-between items-center pt-4 mt-2 border-t-2 border-gray-700">
                <span class="text-gray-300 font-medium">Total Amount</span>
                <span class="text-2xl font-bold text-emerald-400">\${{ order()?.totalAmount }}</span>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="space-y-3">
              @if (order()?.status === 'PENDING') {
                <button (click)="proceedToPayment()" class="btn-accent w-full py-4 text-lg">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
                  </svg>
                  Proceed to Payment
                </button>
              }
              <a routerLink="/events" class="btn-ghost w-full py-3 inline-flex justify-center">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
                </svg>
                Back to Events
              </a>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: []
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
    this.router.navigate(['/payment', this.order()?.id]);
  }
}
