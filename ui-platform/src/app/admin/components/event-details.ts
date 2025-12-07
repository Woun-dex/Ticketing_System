import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AdminService } from '../services/admin.service';
import { Event, EventStatus, Seat, SeatStatus, SeatTypeRequest, SeatGenerationRequest } from '../models/admin.models';
import { SeatMap } from './seats/seat-map';
import { TheaterSeatMap } from './seats/theater-seat-map';

@Component({
  selector: 'app-event-details',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule, SeatMap, TheaterSeatMap],
  templateUrl:'./event-details.html',
  styles: [`
    .animate-in {
      animation: slideIn 0.3s ease-out;
    }
    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
  `]
})
export class EventDetails implements OnInit {
  eventId = signal<number | null>(null);
  event = computed(() => this.adminService.selectedEvent());
  inventory = computed(() => this.adminService.inventory());
  
  activeTab = signal<'details' | 'seats' | 'seat-types' | 'generate'>('details');
  seatViewMode = signal<'grid' | 'theater'>('theater');
  selectedSeat = signal<Seat | null>(null);
  successMessage = signal<string | null>(null);

  SeatStatus = SeatStatus;

  seatTypeForm: FormGroup;
  seatGenForm: FormGroup;

  constructor(
    public adminService: AdminService,
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.seatTypeForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      price: ['', [Validators.required, Validators.min(0)]]
    });

    this.seatGenForm = this.fb.group({
      seatTypeId: ['', Validators.required],
      rowPrefix: ['', [Validators.required, Validators.maxLength(5)]],
      startSeatNumber: [1, [Validators.required, Validators.min(1)]],
      endSeatNumber: [20, [Validators.required, Validators.min(1)]]
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.eventId.set(Number(id));
      this.loadEventData(Number(id));
    }
  }

  loadEventData(id: number): void {
    this.adminService.getEvent(id).subscribe();
    this.adminService.getEventInventory(id).subscribe();
  }

  refreshInventory(): void {
    if (this.eventId()) {
      this.adminService.getEventInventory(this.eventId()!).subscribe();
    }
  }

  hasSeats(): boolean {
    return (this.inventory()?.seats?.length || 0) > 0;
  }

  soldCount = computed(() => 
    this.inventory()?.seats.filter(s => s.status === SeatStatus.SOLD).length || 0
  );

  reservedCount = computed(() => 
    this.inventory()?.seats.filter(s => s.status === SeatStatus.RESERVED).length || 0
  );

  seatsToGenerate = computed(() => {
    const start = this.seatGenForm.get('startSeatNumber')?.value || 0;
    const end = this.seatGenForm.get('endSeatNumber')?.value || 0;
    return Math.max(0, end - start + 1);
  });

  addSeatType(): void {
    if (this.seatTypeForm.invalid || !this.eventId()) return;

    const request: SeatTypeRequest = {
      name: this.seatTypeForm.value.name,
      price: parseFloat(this.seatTypeForm.value.price)
    };

    this.adminService.addSeatType(this.eventId()!, request).subscribe({
      next: () => {
        this.showSuccess('Seat type added successfully');
        this.seatTypeForm.reset();
        this.loadEventData(this.eventId()!);
      }
    });
  }

  generateSeats(): void {
    if (this.seatGenForm.invalid || !this.eventId()) return;

    const request: SeatGenerationRequest = {
      seatTypeId: parseInt(this.seatGenForm.value.seatTypeId),
      rowPrefix: this.seatGenForm.value.rowPrefix.toUpperCase(),
      startSeatNumber: parseInt(this.seatGenForm.value.startSeatNumber),
      endSeatNumber: parseInt(this.seatGenForm.value.endSeatNumber)
    };

    this.adminService.generateSeats(this.eventId()!, request).subscribe({
      next: () => {
        this.showSuccess('Seats generated successfully');
        this.activeTab.set('seats');
      }
    });
  }

  publishEvent(): void {
    if (!this.eventId()) return;

    this.adminService.publishEvent(this.eventId()!).subscribe({
      next: () => {
        this.showSuccess('Event published successfully');
        this.loadEventData(this.eventId()!);
      }
    });
  }

  onSeatClick(seat: Seat): void {
    this.selectedSeat.set(seat);
  }

  updateSeatStatus(status: SeatStatus): void {
    const seat = this.selectedSeat();
    if (!seat) return;

    this.adminService.updateSeatStatus(seat.id, status).subscribe({
      next: (updatedSeat) => {
        this.selectedSeat.set(updatedSeat);
        this.showSuccess(`Seat status updated to ${status}`);
      }
    });
  }

  showSuccess(message: string): void {
    this.successMessage.set(message);
    setTimeout(() => this.successMessage.set(null), 3000);
  }

  formatDateTime(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getStatusClass(status: EventStatus): string {
    const classes: Record<string, string> = {
      'DRAFT': 'bg-yellow-500/20 text-yellow-400',
      'PUBLISHED': 'bg-green-500/20 text-green-400',
      'ARCHIVED': 'bg-gray-500/20 text-gray-400',
      'CANCELLED': 'bg-red-500/20 text-red-400'
    };
    return classes[status] || 'bg-gray-500/20 text-gray-400';
  }

  getSeatTypeColorClass(name: string): string {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('vip')) return 'bg-purple-500/20 text-purple-400';
    if (lowerName.includes('premium')) return 'bg-pink-500/20 text-pink-400';
    if (lowerName.includes('standard')) return 'bg-blue-500/20 text-blue-400';
    if (lowerName.includes('economy')) return 'bg-green-500/20 text-green-400';
    return 'bg-gray-500/20 text-gray-400';
  }
}
