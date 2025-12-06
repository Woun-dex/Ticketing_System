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
  template: `
    <div class="theater-container relative">
      <!-- Theater Screen/Stage -->
      <div class="mb-12 perspective-1000">
        <div class="relative mx-auto max-w-2xl">
          <!-- Glow effect -->
          <div class="absolute inset-0 bg-gradient-to-t from-purple-500/20 to-transparent blur-2xl transform translate-y-4"></div>
          
          <!-- Stage -->
          <div class="relative bg-gradient-to-b from-gray-700 to-gray-800 h-20 rounded-t-full flex items-center justify-center border-t-4 border-purple-500 shadow-2xl shadow-purple-500/20">
            <div class="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-purple-400 to-transparent"></div>
            <span class="text-white font-bold text-xl tracking-[0.5em] uppercase">Stage</span>
          </div>
          
          <!-- Stage lights effect -->
          <div class="flex justify-around mt-2">
            @for (i of [1,2,3,4,5]; track i) {
              <div class="w-2 h-8 bg-gradient-to-b from-yellow-400/50 to-transparent rounded-full"></div>
            }
          </div>
        </div>
      </div>

      <!-- Legend -->
      <div class="flex flex-wrap items-center justify-center gap-6 mb-8 p-4 bg-gray-800/80 backdrop-blur rounded-xl border border-gray-700">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-green-400 to-green-600 shadow-lg shadow-green-500/30"></div>
          <span class="text-gray-300 text-sm">Available</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 shadow-lg shadow-blue-500/30 ring-2 ring-blue-300"></div>
          <span class="text-gray-300 text-sm">Selected</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-lg shadow-yellow-500/30"></div>
          <span class="text-gray-300 text-sm">Reserved</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-red-400 to-red-600 shadow-lg shadow-red-500/30"></div>
          <span class="text-gray-300 text-sm">Sold</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-lg bg-gray-600"></div>
          <span class="text-gray-300 text-sm">Blocked</span>
        </div>
      </div>

      <!-- Seat Type Filter -->
      <div class="flex items-center justify-center gap-3 mb-6">
        <span class="text-gray-400 text-sm">Filter by type:</span>
        <button (click)="filterType.set(null)"
                [class]="filterType() === null ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300'"
                class="px-4 py-1.5 rounded-full text-sm font-medium transition-colors hover:bg-purple-600 hover:text-white">
          All
        </button>
        @for (type of seatTypes(); track type) {
          <button (click)="filterType.set(type)"
                  [class]="filterType() === type ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300'"
                  class="px-4 py-1.5 rounded-full text-sm font-medium transition-colors hover:bg-purple-600 hover:text-white">
            {{ type }}
          </button>
        }
      </div>

      <!-- Theater Seating Area -->
      <div class="overflow-x-auto pb-4">
        <div class="inline-block min-w-full">
          <!-- Curved seating rows -->
          @for (group of filteredSeatsByRow(); track group.row; let rowIndex = $index) {
            <div class="flex items-center justify-center gap-2 mb-3" 
                 [style.padding-left.px]="getRowPadding(rowIndex)"
                 [style.padding-right.px]="getRowPadding(rowIndex)">
              
              <!-- Row Label Left -->
              <div class="w-10 h-10 flex items-center justify-center rounded-lg text-sm font-bold shrink-0"
                   [class]="getRowLabelClass(group.row)">
                {{ group.row }}
              </div>
              
              <!-- Seats -->
              <div class="flex gap-2 items-center">
                <!-- Left aisle space for larger venues -->
                @if (group.seats.length > 15) {
                  <div class="w-6"></div>
                }
                
                @for (seat of group.seats; track seat.id; let seatIndex = $index) {
                  <!-- Center aisle -->
                  @if (group.seats.length > 10 && seatIndex === Math.floor(group.seats.length / 2)) {
                    <div class="w-8"></div>
                  }
                  
                  <button 
                    (click)="onSeatClick(seat)"
                    [disabled]="!isClickable(seat)"
                    class="seat-btn relative group"
                    [class]="getSeatClass(seat)">
                    
                    <!-- Seat shape -->
                    <div class="w-10 h-10 rounded-t-lg rounded-b-sm flex items-center justify-center text-xs font-bold transition-all duration-200 group-hover:scale-110">
                      {{ seat.number }}
                    </div>
                    
                    <!-- Armrests -->
                    <div class="absolute -left-0.5 top-1/2 w-1 h-4 rounded-l bg-current opacity-50"></div>
                    <div class="absolute -right-0.5 top-1/2 w-1 h-4 rounded-r bg-current opacity-50"></div>
                    
                    <!-- Tooltip -->
                    <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-3 py-2 bg-gray-900 rounded-lg text-white text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl z-20 border border-gray-700">
                      <div class="font-bold text-purple-400">Row {{ seat.row }}, Seat {{ seat.number }}</div>
                      <div class="text-gray-300 mt-1">{{ seat.typeName }}</div>
                      <div class="text-green-400 font-medium">\${{ seat.price }}</div>
                      <div class="mt-1 capitalize" [class]="getStatusTextClass(seat.status)">
                        {{ seat.status.toLowerCase() }}
                      </div>
                      <div class="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-gray-900"></div>
                    </div>
                  </button>
                }
                
                <!-- Right aisle space -->
                @if (group.seats.length > 15) {
                  <div class="w-6"></div>
                }
              </div>
              
              <!-- Row Label Right -->
              <div class="w-10 h-10 flex items-center justify-center rounded-lg text-sm font-bold shrink-0"
                   [class]="getRowLabelClass(group.row)">
                {{ group.row }}
              </div>
            </div>
          }
        </div>
      </div>

      <!-- Bottom Info -->
      <div class="mt-8 flex items-center justify-center gap-2 text-gray-400 text-sm">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        <span>Click on a seat to select or change its status</span>
      </div>

      <!-- Statistics Bar -->
      <div class="mt-8 bg-gray-800/80 backdrop-blur rounded-xl p-6 border border-gray-700">
        <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div class="text-center">
            <div class="text-3xl font-bold text-white">{{ totalSeats() }}</div>
            <div class="text-sm text-gray-400">Total Seats</div>
          </div>
          <div class="text-center">
            <div class="text-3xl font-bold text-green-400">{{ availableSeats() }}</div>
            <div class="text-sm text-gray-400">Available</div>
          </div>
          <div class="text-center">
            <div class="text-3xl font-bold text-red-400">{{ soldSeats() }}</div>
            <div class="text-sm text-gray-400">Sold</div>
          </div>
          <div class="text-center">
            <div class="text-3xl font-bold text-yellow-400">{{ reservedSeats() }}</div>
            <div class="text-sm text-gray-400">Reserved</div>
          </div>
          <div class="text-center">
            <div class="text-3xl font-bold text-purple-400">{{ occupancyRate() }}%</div>
            <div class="text-sm text-gray-400">Occupancy</div>
          </div>
        </div>
        
        <!-- Progress bar -->
        <div class="mt-4 h-3 bg-gray-700 rounded-full overflow-hidden">
          <div class="h-full flex">
            <div class="bg-red-500 transition-all duration-500" [style.width.%]="soldPercentage()"></div>
            <div class="bg-yellow-500 transition-all duration-500" [style.width.%]="reservedPercentage()"></div>
            <div class="bg-gray-600 transition-all duration-500" [style.width.%]="blockedPercentage()"></div>
          </div>
        </div>
      </div>
    </div>
  `,
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
      return 'bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30';
    }
    return 'bg-gray-700 text-gray-300';
  }

  getSeatClass(seat: Seat): string {
    const isSelected = this.selectedSeatId === seat.id;
    
    const baseClasses = 'text-white';
    
    if (isSelected) {
      return `${baseClasses} [&>div]:bg-gradient-to-br [&>div]:from-blue-400 [&>div]:to-blue-600 [&>div]:shadow-lg [&>div]:shadow-blue-500/50 [&>div]:ring-2 [&>div]:ring-blue-300`;
    }

    switch (seat.status) {
      case SeatStatus.AVAILABLE:
        return `${baseClasses} [&>div]:bg-gradient-to-br [&>div]:from-green-400 [&>div]:to-green-600 [&>div]:shadow-lg [&>div]:shadow-green-500/30 hover:[&>div]:shadow-green-500/50`;
      case SeatStatus.RESERVED:
        return `${baseClasses} [&>div]:bg-gradient-to-br [&>div]:from-yellow-400 [&>div]:to-yellow-600 [&>div]:shadow-lg [&>div]:shadow-yellow-500/30`;
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
