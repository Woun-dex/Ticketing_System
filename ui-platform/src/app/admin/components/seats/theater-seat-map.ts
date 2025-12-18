import { Component, Input, Output, EventEmitter, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Seat, SeatStatus } from '../../models/admin.models';

interface SeatGroup {
  row: string;
  seats: Seat[];
}

@Component({
  selector: 'app-theater-seat-map',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './theater-seat-map.html'  ,
  styles: [`
    .seat-btn {
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .seat-btn:disabled {
      cursor: not-allowed;
    }
    .seat-btn:not(:disabled):hover {
      transform: translateY(-2px);
    }
    .seat-btn:not(:disabled):active {
      transform: translateY(0);
    }
    .perspective-1000 {
      perspective: 1000px;
    }
  `]
})
export class TheaterSeatMap {
  @Input() seats: Seat[] = [];
  @Input() selectedSeatId: number | null = null;
  @Input() selectedSeatIds: number[] = []; // Support multiple selection
  @Input() editMode = false;
  
  @Output() seatClick = new EventEmitter<Seat>();

  filterType = signal<string | null>(null);
  Math = Math;

  seatTypes = computed(() => {
    const types = new Set<string>();
    this.seats.forEach(s => types.add(s.typeName));
    return Array.from(types);
  });

  filteredSeats = computed(() => {
    const type = this.filterType();
    if (!type) return this.seats;
    return this.seats.filter(s => s.typeName === type);
  });

  filteredSeatsByRow = computed(() => {
    const groups: Map<string, Seat[]> = new Map();
    
    const sortedSeats = [...this.filteredSeats()].sort((a, b) => {
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

    const result: { row: string; seats: Seat[] }[] = [];
    groups.forEach((seats, row) => {
      result.push({ row, seats });
    });

    return result;
  });

  totalSeats = computed(() => this.seats.length);
  availableSeats = computed(() => this.seats.filter(s => s.status === SeatStatus.AVAILABLE).length);
  soldSeats = computed(() => this.seats.filter(s => s.status === SeatStatus.SOLD).length);
  reservedSeats = computed(() => this.seats.filter(s => s.status === SeatStatus.RESERVED).length);
  blockedSeats = computed(() => this.seats.filter(s => s.status === SeatStatus.BLOCKED).length);

  occupancyRate = computed(() => {
    const total = this.totalSeats();
    if (total === 0) return 0;
    const occupied = this.soldSeats() + this.reservedSeats();
    return Math.round((occupied / total) * 100);
  });

  soldPercentage = computed(() => {
    const total = this.totalSeats();
    return total > 0 ? (this.soldSeats() / total) * 100 : 0;
  });

  reservedPercentage = computed(() => {
    const total = this.totalSeats();
    return total > 0 ? (this.reservedSeats() / total) * 100 : 0;
  });

  blockedPercentage = computed(() => {
    const total = this.totalSeats();
    return total > 0 ? (this.blockedSeats() / total) * 100 : 0;
  });

  getRowPadding(rowIndex: number): number {
    // Create a curved theater effect
    const maxPadding = 60;
    const totalRows = this.filteredSeatsByRow().length;
    const middleRow = totalRows / 2;
    const distance = Math.abs(rowIndex - middleRow);
    return Math.max(0, maxPadding - (distance * 10));
  }

  getRowLabelClass(row: string): string {
    // VIP rows get special styling
    if (row.toLowerCase().includes('vip') || row === 'A' || row === 'B') {
      return 'bg-gradient-to-br from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/30';
    }
    return 'bg-gray-700 text-gray-300';
  }

  getSeatClass(seat: Seat): string {
    // Check both single selection and multiple selection
    const isSelected = this.selectedSeatId === seat.id || this.selectedSeatIds.includes(seat.id);
    
    const baseClasses = 'text-white';
    
    if (isSelected) {
      return `${baseClasses} [&>div]:bg-gradient-to-br [&>div]:from-indigo-400 [&>div]:to-indigo-600 [&>div]:shadow-lg [&>div]:shadow-indigo-500/50 [&>div]:ring-2 [&>div]:ring-indigo-300`;
    }

    switch (seat.status) {
      case SeatStatus.AVAILABLE:
        return `${baseClasses} [&>div]:bg-gradient-to-br [&>div]:from-emerald-400 [&>div]:to-emerald-600 [&>div]:shadow-lg [&>div]:shadow-emerald-500/30 hover:[&>div]:shadow-emerald-500/50`;
      case SeatStatus.RESERVED:
        return `${baseClasses} [&>div]:bg-gradient-to-br [&>div]:from-amber-400 [&>div]:to-amber-600 [&>div]:shadow-lg [&>div]:shadow-amber-500/30`;
      case SeatStatus.SOLD:
        return `${baseClasses} [&>div]:bg-gradient-to-br [&>div]:from-red-400 [&>div]:to-red-600 [&>div]:shadow-lg [&>div]:shadow-red-500/30`;
      case SeatStatus.BLOCKED:
        return `text-gray-400 [&>div]:bg-gray-600`;
      default:
        return `text-gray-400 [&>div]:bg-gray-600`;
    }
  }

  getStatusTextClass(status: SeatStatus): string {
    switch (status) {
      case SeatStatus.AVAILABLE:
        return 'text-emerald-400';
      case SeatStatus.RESERVED:
        return 'text-amber-400';
      case SeatStatus.SOLD:
        return 'text-red-400';
      case SeatStatus.BLOCKED:
        return 'text-gray-400';
      default:
        return 'text-gray-400';
    }
  }

  isClickable(seat: Seat): boolean {
    if (this.editMode) {
      return true;
    }
    return seat.status === SeatStatus.AVAILABLE;
  }

  onSeatClick(seat: Seat): void {
    if (this.isClickable(seat)) {
      this.seatClick.emit(seat);
    }
  }
}
