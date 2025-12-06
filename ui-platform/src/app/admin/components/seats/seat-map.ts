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
  template: `
    <div class="seat-map-container">
      <!-- Stage Area -->
      <div class="mb-8">
        <div class="bg-gradient-to-r from-purple-600 to-pink-600 rounded-t-full h-16 flex items-center justify-center shadow-lg shadow-purple-500/30">
          <span class="text-white font-bold text-lg tracking-wider">STAGE</span>
        </div>
      </div>

      <!-- Legend -->
      <div class="flex flex-wrap items-center justify-center gap-6 mb-8 p-4 bg-gray-800/50 rounded-lg">
        <div class="flex items-center gap-2">
          <div class="w-6 h-6 rounded bg-green-500 shadow-lg shadow-green-500/30"></div>
          <span class="text-gray-300 text-sm">Available</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-6 h-6 rounded bg-blue-500 shadow-lg shadow-blue-500/30"></div>
          <span class="text-gray-300 text-sm">Selected</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-6 h-6 rounded bg-yellow-500 shadow-lg shadow-yellow-500/30"></div>
          <span class="text-gray-300 text-sm">Reserved</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-6 h-6 rounded bg-red-500 shadow-lg shadow-red-500/30"></div>
          <span class="text-gray-300 text-sm">Sold</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-6 h-6 rounded bg-gray-600"></div>
          <span class="text-gray-300 text-sm">Blocked</span>
        </div>
      </div>

      <!-- Seats Grid -->
      <div class="overflow-x-auto pb-4">
        <div class="inline-block min-w-full">
          @for (group of seatsByRow(); track group.row) {
            <div class="flex items-center gap-2 mb-3">
              <!-- Row Label -->
              <div class="w-10 h-10 flex items-center justify-center bg-gray-700 rounded-lg text-white font-bold text-sm shrink-0">
                {{ group.row }}
              </div>
              
              <!-- Seats in Row -->
              <div class="flex gap-2 flex-wrap">
                @for (seat of group.seats; track seat.id) {
                  <button 
                    (click)="onSeatClick(seat)"
                    [disabled]="!isClickable(seat)"
                    class="seat-btn w-10 h-10 rounded-lg flex items-center justify-center text-xs font-medium transition-all duration-200 relative group"
                    [class]="getSeatClass(seat)"
                    [title]="getSeatTooltip(seat)">
                    <span class="relative z-10">{{ seat.number }}</span>
                    
                    <!-- Hover tooltip -->
                    <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 rounded-lg text-white text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl z-20">
                      <div class="font-medium">{{ seat.typeName }}</div>
                      <div class="text-gray-400">\${{ seat.price }}</div>
                      <div class="text-xs mt-1 capitalize" [class]="getStatusTextClass(seat.status)">
                        {{ seat.status.toLowerCase() }}
                      </div>
                      <div class="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                    </div>
                  </button>
                }
              </div>

              <!-- Row Label (Right) -->
              <div class="w-10 h-10 flex items-center justify-center bg-gray-700 rounded-lg text-white font-bold text-sm shrink-0">
                {{ group.row }}
              </div>
            </div>
          }
        </div>
      </div>

      <!-- Summary Stats -->
      <div class="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="bg-gray-800 rounded-lg p-4 text-center">
          <div class="text-2xl font-bold text-white">{{ totalSeats() }}</div>
          <div class="text-sm text-gray-400">Total Seats</div>
        </div>
        <div class="bg-gray-800 rounded-lg p-4 text-center">
          <div class="text-2xl font-bold text-green-400">{{ availableSeats() }}</div>
          <div class="text-sm text-gray-400">Available</div>
        </div>
        <div class="bg-gray-800 rounded-lg p-4 text-center">
          <div class="text-2xl font-bold text-red-400">{{ soldSeats() }}</div>
          <div class="text-sm text-gray-400">Sold</div>
        </div>
        <div class="bg-gray-800 rounded-lg p-4 text-center">
          <div class="text-2xl font-bold text-yellow-400">{{ reservedSeats() }}</div>
          <div class="text-sm text-gray-400">Reserved</div>
        </div>
      </div>
    </div>
  `,
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
