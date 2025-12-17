import { Component, OnInit, signal, computed, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { QueueService } from './queue.service';
import { AuthService } from '../services/auth.service';
import { SearchService } from '../services/search.service';

@Component({
  selector: 'app-queue',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './queue.html',
  styleUrl: './queue.css',
})
export class Queue implements OnInit, OnDestroy {
  eventId = signal<string>('');
  eventName = signal<string>('Loading...');
  
  status = signal<'IDLE' | 'WAITING' | 'PROMOTED' | 'BOOKING'>('IDLE');
  queuePosition = signal<number | null>(null);
  bookingToken = signal<string | null>(null);
  errorMsg = signal<string | null>(null);

  user = computed(() => this.authService.user());
  userId = computed(() => this.user()?.id || 'user_' + Math.floor(Math.random() * 1000));

  constructor(
    private route: ActivatedRoute,
    private queueService: QueueService,
    private authService: AuthService,
    private searchService: SearchService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }

    this.route.params.subscribe(params => {
      const eventId = params['eventId'];
      if (eventId) {
        this.eventId.set(eventId);
        this.loadEventDetails(eventId);
      } else {
        this.router.navigate(['/events']);
      }
    });
  }

  ngOnDestroy(): void {
    // Cleanup WebSocket if needed
  }

  loadEventDetails(eventId: string): void {
    this.searchService.searchByEventId(parseInt(eventId)).subscribe({
      next: (response) => {
        this.eventName.set(response.eventName);
      },
      error: () => {
        this.eventName.set('Event');
      }
    });
  }

  joinQueue(): void {
    this.status.set('WAITING');
    this.errorMsg.set(null);

    this.queueService.connectToQueue(this.eventId(), this.userId()).subscribe({
      next: (data) => {
        console.log('Received data:', data);

        if (data.position !== undefined) {
          this.queuePosition.set(data.position);
        }

        // Only handle promotion when server explicitly says PROMOTED
        if (data.status === 'PROMOTED') {
          this.handlePromotion();
        }
      },
      error: (err) => {
        this.errorMsg.set('Connection error: ' + err);
        console.error('WebSocket error:', err);
      },
    });
  }

  handlePromotion(): void {
    this.status.set('PROMOTED');
    console.log('User promoted, fetching booking token...');

    const token = this.authService.getToken();
    if (!token) {
      this.errorMsg.set('No authentication token found');
      return;
    }

    this.queueService.getBookingToken(token, this.eventId()).subscribe({
      next: (response) => {
        this.bookingToken.set(response.bookingToken);
        this.status.set('BOOKING');
        console.log('Received booking token:', this.bookingToken());
      },
      error: (err) => {
        this.errorMsg.set('Error fetching booking token: ' + err);
        console.error('Error fetching booking token:', err);
      },
    });
  }

  goToSeatSelection(): void {
    this.router.navigate(['/seats', this.eventId()], {
      queryParams: { token: this.bookingToken() }
    });
  }

  goBack(): void {
    this.router.navigate(['/events']);
  }

  logout(): void {
    this.authService.logout();
  }
}
