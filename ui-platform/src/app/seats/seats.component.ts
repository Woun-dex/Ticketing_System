import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { SearchService, SeatDocument, SearchResponse } from '../services/search.service';
import { BookingService } from '../services/booking.service';
import { AuthService } from '../services/auth.service';
import { TheaterSeatMap } from '../admin/components/seats/theater-seat-map';
import { Seat, SeatStatus } from '../admin/models/admin.models';

@Component({
  selector: 'app-seats',
  standalone: true,
  imports: [CommonModule, TheaterSeatMap],
  templateUrl: './seats.component.html'
})
export class SeatsComponent implements OnInit, OnDestroy {
  eventId = signal<string>('');
  bookingToken = signal<string | null>(null);
  eventInfo = signal<SearchResponse | null>(null);
  selectedSeats = signal<SeatDocument[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  booking = signal(false);
  timeRemaining = signal(300); // 5 minutes in seconds

  private timerInterval: any;

  // Convert SeatDocument[] to Seat[] for the TheaterSeatMap component
  mappedSeats = computed(() => {
    const seats = this.eventInfo()?.seats || [];
    return seats.map(seat => this.mapToSeat(seat));
  });

  // Get array of selected seat IDs for the TheaterSeatMap
  selectedSeatIds = computed(() => {
    return this.selectedSeats().map(s => parseInt(s.id));
  });

  totalPrice = computed(() => {
    return this.selectedSeats().reduce((sum, seat) => sum + seat.price, 0);
  });

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private searchService: SearchService,
    private bookingService: BookingService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.eventId.set(params['eventId']);
      this.loadSeats();
    });

    this.route.queryParams.subscribe(params => {
      if (params['token']) {
        this.bookingToken.set(params['token']);
      }
    });

    this.startTimer();
  }

  ngOnDestroy(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  // Map SeatDocument (from search service) to Seat (admin model)
  private mapToSeat(seatDoc: SeatDocument): Seat {
    return {
      id: parseInt(seatDoc.id),
      row: seatDoc.rowNumber,
      number: seatDoc.seatNumber,
      status: seatDoc.status as SeatStatus,
      typeName: seatDoc.seatTypeName,
      price: seatDoc.price
    };
  }

  // Find the original SeatDocument by ID
  private findSeatDocById(seatId: number): SeatDocument | undefined {
    return this.eventInfo()?.seats.find(s => parseInt(s.id) === seatId);
  }

  startTimer(): void {
    this.timerInterval = setInterval(() => {
      const remaining = this.timeRemaining() - 1;
      if (remaining <= 0) {
        clearInterval(this.timerInterval);
        this.router.navigate(['/events']);
        alert('Your session has expired. Please try again.');
      } else {
        this.timeRemaining.set(remaining);
      }
    }, 1000);
  }

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  loadSeats(): void {
    this.loading.set(true);
    this.error.set(null);

    const eventIdNum = parseInt(this.eventId());
    this.searchService.searchByEventId(eventIdNum).subscribe({
      next: (response) => {
        this.eventInfo.set(response);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load seats. Please try again.');
        this.loading.set(false);
        console.error(err);
      }
    });
  }

  // Handle seat click from TheaterSeatMap
  onSeatClick(seat: Seat): void {
    // Find the original SeatDocument
    const seatDoc = this.findSeatDocById(seat.id);
    if (!seatDoc) return;

    if (seatDoc.status !== 'AVAILABLE') return;

    const current = this.selectedSeats();
    const isSelected = current.some(s => parseInt(s.id) === seat.id);
    
    if (isSelected) {
      // Remove from selection
      this.selectedSeats.set(current.filter(s => parseInt(s.id) !== seat.id));
    } else {
      // Add to selection
      this.selectedSeats.set([...current, seatDoc]);
    }
  }

  removeSeat(seat: SeatDocument): void {
    const current = this.selectedSeats();
    this.selectedSeats.set(current.filter(s => s.id !== seat.id));
  }

  clearSelection(): void {
    this.selectedSeats.set([]);
  }

  confirmBooking(): void {
    if (this.selectedSeats().length === 0) return;

    this.booking.set(true);
    const seatIds = this.selectedSeats().map(s => parseInt(s.id));

    this.bookingService.createBooking({
      eventId: parseInt(this.eventId()),
      seatIds: seatIds
    }).subscribe({
      next: (response) => {
        this.booking.set(false);
        this.router.navigate(['/booking/confirmation', response.orderId]);
      },
      error: (err) => {
        this.booking.set(false);
        alert('Booking failed: ' + (err.error?.message || 'Unknown error'));
        console.error(err);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/events']);
  }
}
