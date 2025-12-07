import { Component, Input, Output, EventEmitter, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Seat, SeatStatus } from '../../models/admin.models';

interface SeatGroup {
  row: string;
  seats: Seat[];
}

@Component({
  selector: 'app-seat-map',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './seat-map.html',
  styles: [`
    .seat-btn {
      cursor: pointer;
    }
    .seat-btn:disabled {
      cursor: not-allowed;
    }
    .seat-btn:not(:disabled):hover {
      transform: scale(1.1);
    }
  `]
})
export class SeatMap {
  @Input() seats: Seat[] = [];
  @Input() selectedSeatId: number | null = null;
  @Input() editMode = false;
  
  @Output() seatClick = new EventEmitter<Seat>();

  seatsByRow = computed(() => {
    const groups: Map<string, Seat[]> = new Map();
    
    // Sort seats and group by row
    const sortedSeats = [...this.seats].sort((a, b) => {
      if (a.row !== b.row) {
        return a.row.localeCompare(b.row);
      }
      return parseInt(a.number) - parseInt(b.number);
    });

    for (const seat of sortedSeats) {
      if (!groups.has(seat.row)) {
        groups.set(seat.row, []);
      }
      groups.get(seat.row)!.push(seat);
    }

    const result: SeatGroup[] = [];
    groups.forEach((seats, row) => {
      result.push({ row, seats });
    });

    return result;
  });

  totalSeats = computed(() => this.seats.length);
  availableSeats = computed(() => this.seats.filter(s => s.status === SeatStatus.AVAILABLE).length);
  soldSeats = computed(() => this.seats.filter(s => s.status === SeatStatus.SOLD).length);
  reservedSeats = computed(() => this.seats.filter(s => s.status === SeatStatus.RESERVED).length);

  getSeatClass(seat: Seat): string {
    const isSelected = this.selectedSeatId === seat.id;
    
    if (isSelected) {
      return 'bg-blue-500 text-white shadow-lg shadow-blue-500/50 ring-2 ring-blue-300';
    }

    switch (seat.status) {
      case SeatStatus.AVAILABLE:
        return 'bg-green-500 text-white shadow-lg shadow-green-500/30 hover:shadow-green-500/50';
      case SeatStatus.RESERVED:
        return 'bg-yellow-500 text-white shadow-lg shadow-yellow-500/30';
      case SeatStatus.SOLD:
        return 'bg-red-500 text-white shadow-lg shadow-red-500/30';
      case SeatStatus.BLOCKED:
        return 'bg-gray-600 text-gray-400';
      default:
        return 'bg-gray-600 text-gray-400';
    }
  }

  getStatusTextClass(status: SeatStatus): string {
    switch (status) {
      case SeatStatus.AVAILABLE:
        return 'text-green-400';
      case SeatStatus.RESERVED:
        return 'text-yellow-400';
      case SeatStatus.SOLD:
        return 'text-red-400';
      case SeatStatus.BLOCKED:
        return 'text-gray-400';
      default:
        return 'text-gray-400';
    }
  }

  getSeatTooltip(seat: Seat): string {
    return `Row ${seat.row}, Seat ${seat.number} - ${seat.typeName} - $${seat.price} (${seat.status})`;
  }

  isClickable(seat: Seat): boolean {
    if (this.editMode) {
      return true; // Admin can click any seat in edit mode
    }
    return seat.status === SeatStatus.AVAILABLE;
  }

  onSeatClick(seat: Seat): void {
    if (this.isClickable(seat)) {
      this.seatClick.emit(seat);
    }
  }
}
