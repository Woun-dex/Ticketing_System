import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { QueueService } from './queue.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-queue',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './queue.html',
  styleUrl: './queue.css',
})
export class Queue implements OnInit {
  eventId = 'event123';
  
  status = signal<'IDLE' | 'WAITING' | 'PROMOTED' | 'BOOKING'>('IDLE');
  queuePosition = signal<number | null>(null);
  bookingToken = signal<string | null>(null);
  errorMsg = signal<string | null>(null);

  user = computed(() => this.authService.user());
  userId = computed(() => this.user()?.id || 'user_' + Math.floor(Math.random() * 1000));

  constructor(
    private queueService: QueueService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
    }
  }

  joinQueue(): void {
    this.status.set('WAITING');
    this.errorMsg.set(null);

    this.queueService.connectToQueue(this.eventId, this.userId()).subscribe({
      next: (data) => {
        console.log('Received data:', data);

        if (data.position !== undefined) {
          this.queuePosition.set(data.position);
        }

        if (data.status === 'PROMOTED' || (this.queuePosition() !== null && this.queuePosition()! <= 0)) {
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

    this.queueService.getBookingToken(token, this.eventId).subscribe({
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

  logout(): void {
    this.authService.logout();
  }
}
