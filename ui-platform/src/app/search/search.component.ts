import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SearchService, EventDocument, SearchResponse, SeatDocument } from '../services/search.service';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="page-gradient-radial">
      <!-- Header -->
      <header class="text-center py-12 px-4 fade-in">
        <div class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mb-4 shadow-lg">
          <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
        </div>
        <h1 class="text-4xl font-bold text-white mb-2">Find Events & Tickets</h1>
        <p class="text-gray-400">Search for events and check available seats</p>
      </header>

      <!-- Search Box -->
      <div class="max-w-4xl mx-auto px-4 mb-8 slide-up">
        <div class="glass-card p-6">
          <div class="flex flex-col sm:flex-row gap-4 mb-4">
            <div class="flex-1 relative">
              <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
              </div>
              <input 
                type="text" 
                [(ngModel)]="searchQuery"
                (keyup.enter)="searchEvents()"
                placeholder="Search events by name..."
                class="input-field pl-12"
              />
            </div>
            <button (click)="searchEvents()" class="btn-primary px-8">
              Search
            </button>
          </div>
          
          <div class="flex flex-wrap gap-3">
            <button 
              (click)="loadAvailableEvents()" 
              class="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200"
              [class]="currentFilter() === 'available' 
                ? 'bg-indigo-500 text-white' 
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'">
              <span class="flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                Available Events
              </span>
            </button>
            <button 
              (click)="loadAllEvents()" 
              class="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200"
              [class]="currentFilter() === 'all' 
                ? 'bg-indigo-500 text-white' 
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'">
              <span class="flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"/>
                </svg>
                All Events
              </span>
            </button>
          </div>
        </div>
      </div>

      <!-- Content Area -->
      <div class="max-w-7xl mx-auto px-4 pb-12">
        @if (loading()) {
          <div class="flex flex-col items-center justify-center py-16 fade-in">
            <div class="spinner mb-4"></div>
            <p class="text-gray-400">Loading events...</p>
          </div>
        }

        @if (error()) {
          <div class="glass-card p-8 text-center max-w-md mx-auto" style="background: var(--color-error-bg); border: 1px solid rgba(239, 68, 68, 0.3);">
            <svg class="w-12 h-12 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
            <p class="text-red-400 mb-4">{{ error() }}</p>
            <button (click)="loadAllEvents()" class="btn-primary">Try Again</button>
          </div>
        }

        @if (!loading() && !error()) {
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            @for (event of events(); track event.id; let i = $index) {
              <div class="glass-card overflow-hidden group slide-up" 
                   [style.animation-delay]="(i * 0.05) + 's'"
                   [class.opacity-60]="event.availableSeats === 0">
                <!-- Card Header -->
                <div class="h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500"></div>
                
                <div class="p-6">
                  <div class="flex justify-between items-start mb-4">
                    <span class="badge-default">{{ event.type }}</span>
                    <span class="badge-default" 
                          [class]="event.status === 'PUBLISHED' ? 'badge-success' : 'badge-warning'">
                      {{ event.status }}
                    </span>
                  </div>
                  
                  <h3 class="text-xl font-bold text-white mb-4 group-hover:text-indigo-400 transition-colors">
                    {{ event.name }}
                  </h3>
                  
                  <div class="space-y-2 mb-4 text-sm">
                    <div class="flex items-center gap-2 text-gray-400">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                      </svg>
                      {{ formatDate(event.startTime) }}
                    </div>
                    <div class="flex items-center gap-2 text-gray-400">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                      {{ formatDate(event.endTime) }}
                    </div>
                  </div>
                  
                  <!-- Seats Info -->
                  <div class="bg-gray-800/50 rounded-xl p-4 mb-4">
                    <div class="flex items-center justify-between">
                      <div>
                        <span class="text-3xl font-bold" 
                              [class]="event.availableSeats > 0 ? 'text-emerald-400' : 'text-red-400'">
                          {{ event.availableSeats }}
                        </span>
                        <span class="text-gray-500 text-sm ml-1">available</span>
                      </div>
                      <div class="text-right text-gray-500 text-sm">
                        of {{ event.totalSeats }} total
                      </div>
                    </div>
                    <!-- Progress bar -->
                    <div class="mt-2 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                      <div class="h-full rounded-full transition-all duration-500"
                           [class]="event.availableSeats > 0 ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' : 'bg-red-500'"
                           [style.width.%]="(event.availableSeats / event.totalSeats) * 100">
                      </div>
                    </div>
                  </div>
                  
                  <button 
                    (click)="viewEventSeats(event)"
                    [disabled]="event.availableSeats === 0"
                    class="w-full py-3 rounded-xl font-semibold transition-all duration-200"
                    [class]="event.availableSeats > 0 
                      ? 'btn-accent' 
                      : 'bg-gray-700 text-gray-500 cursor-not-allowed'">
                    {{ event.availableSeats > 0 ? 'View Seats' : 'Sold Out' }}
                  </button>
                </div>
              </div>
            } @empty {
              <div class="col-span-full text-center py-16">
                <svg class="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <p class="text-gray-400 text-lg">No events found</p>
                <p class="text-gray-600">Try a different search or check back later</p>
              </div>
            }
          </div>
        }
      </div>

      <!-- Modal -->
      @if (selectedEvent()) {
        <div class="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" 
             (click)="closeModal()">
          <div class="glass-card max-w-3xl w-full max-h-[90vh] overflow-y-auto slide-up" 
               (click)="$event.stopPropagation()">
            <div class="sticky top-0 bg-gray-900/95 backdrop-blur p-6 border-b border-gray-700/50 flex justify-between items-start">
              <div>
                <h2 class="text-2xl font-bold text-white">{{ selectedEvent()?.eventName }}</h2>
                <p class="text-gray-400 mt-1">
                  Available: {{ selectedEvent()?.availableSeats }} / {{ selectedEvent()?.totalSeats }} seats
                </p>
              </div>
              <button (click)="closeModal()" class="p-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-white">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
            
            <div class="p-6">
              @if (loadingSeats()) {
                <div class="flex justify-center py-8">
                  <div class="spinner"></div>
                </div>
              } @else {
                <div class="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2 mb-6">
                  @for (seat of selectedEvent()?.seats; track seat.id) {
                    <button 
                      class="aspect-square rounded-lg flex flex-col items-center justify-center text-xs font-medium transition-all duration-200"
                      [class]="getSeatClass(seat)"
                      [disabled]="seat.status !== 'AVAILABLE'"
                      (click)="toggleSeatSelection(seat)">
                      <span>{{ seat.rowNumber }}{{ seat.seatNumber }}</span>
                      <span class="text-[10px] opacity-70">\${{ seat.price }}</span>
                    </button>
                  } @empty {
                    <p class="col-span-full text-center text-gray-500 py-8">No seats available</p>
                  }
                </div>
                
                @if (selectedSeats().length > 0) {
                  <div class="bg-gray-800/50 rounded-xl p-4 mb-6">
                    <div class="flex items-center justify-between mb-4">
                      <span class="text-gray-400">Selected: {{ selectedSeats().length }} seat(s)</span>
                      <span class="text-2xl font-bold text-emerald-400">\${{ calculateTotal() }}</span>
                    </div>
                    <button (click)="proceedToBooking()" class="btn-accent w-full py-3">
                      Proceed to Booking
                    </button>
                  </div>
                }
                
                <!-- Legend -->
                <div class="flex flex-wrap justify-center gap-4 pt-4 border-t border-gray-700/50">
                  <div class="flex items-center gap-2">
                    <div class="w-6 h-6 rounded bg-emerald-500/20 border-2 border-emerald-500"></div>
                    <span class="text-gray-400 text-sm">Available</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <div class="w-6 h-6 rounded bg-amber-500/20 border-2 border-amber-500"></div>
                    <span class="text-gray-400 text-sm">Reserved</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <div class="w-6 h-6 rounded bg-red-500/20 border-2 border-red-500"></div>
                    <span class="text-gray-400 text-sm">Sold</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <div class="w-6 h-6 rounded bg-indigo-500 border-2 border-indigo-400"></div>
                    <span class="text-gray-400 text-sm">Selected</span>
                  </div>
                </div>
              }
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: []
})
export class SearchComponent implements OnInit {
  searchQuery = '';
  events = signal<EventDocument[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  currentFilter = signal<'all' | 'available'>('all');
  
  selectedEvent = signal<SearchResponse | null>(null);
  loadingSeats = signal(false);
  selectedSeats = signal<SeatDocument[]>([]);

  constructor(private searchService: SearchService) {}

  ngOnInit() {
    this.loadAllEvents();
  }

  loadAllEvents() {
    this.loading.set(true);
    this.error.set(null);
    this.currentFilter.set('all');
    
    this.searchService.searchEvents().subscribe({
      next: (events) => {
        this.events.set(events);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load events. Please try again.');
        this.loading.set(false);
        console.error(err);
      }
    });
  }

  loadAvailableEvents() {
    this.loading.set(true);
    this.error.set(null);
    this.currentFilter.set('available');
    
    this.searchService.getAvailableEvents().subscribe({
      next: (events) => {
        this.events.set(events);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load events. Please try again.');
        this.loading.set(false);
        console.error(err);
      }
    });
  }

  searchEvents() {
    if (!this.searchQuery.trim()) {
      this.loadAllEvents();
      return;
    }
    
    this.loading.set(true);
    this.error.set(null);
    
    this.searchService.searchEvents(this.searchQuery).subscribe({
      next: (events) => {
        this.events.set(events);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Search failed. Please try again.');
        this.loading.set(false);
        console.error(err);
      }
    });
  }

  viewEventSeats(event: EventDocument) {
    this.loadingSeats.set(true);
    this.selectedSeats.set([]);
    
    this.searchService.searchByEventId(parseInt(event.id)).subscribe({
      next: (response) => {
        this.selectedEvent.set(response);
        this.loadingSeats.set(false);
      },
      error: (err) => {
        console.error(err);
        this.loadingSeats.set(false);
      }
    });
  }

  closeModal() {
    this.selectedEvent.set(null);
    this.selectedSeats.set([]);
  }

  toggleSeatSelection(seat: SeatDocument) {
    if (seat.status !== 'AVAILABLE') return;
    
    const current = this.selectedSeats();
    const index = current.findIndex(s => s.id === seat.id);
    
    if (index > -1) {
      this.selectedSeats.set(current.filter(s => s.id !== seat.id));
    } else {
      this.selectedSeats.set([...current, seat]);
    }
  }

  isSelected(seat: SeatDocument): boolean {
    return this.selectedSeats().some(s => s.id === seat.id);
  }

  getSeatClass(seat: SeatDocument): string {
    if (this.isSelected(seat)) {
      return 'bg-indigo-500 border-2 border-indigo-400 text-white';
    }
    switch (seat.status) {
      case 'AVAILABLE':
        return 'bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400 hover:bg-emerald-500 hover:text-white cursor-pointer';
      case 'RESERVED':
        return 'bg-amber-500/20 border-2 border-amber-500 text-amber-400 cursor-not-allowed';
      case 'SOLD':
        return 'bg-red-500/20 border-2 border-red-500 text-red-400 cursor-not-allowed';
      default:
        return 'bg-gray-700 border-2 border-gray-600 text-gray-400';
    }
  }

  calculateTotal(): number {
    return this.selectedSeats().reduce((sum, seat) => sum + seat.price, 0);
  }

  proceedToBooking() {
    const seatIds = this.selectedSeats().map(s => s.id);
    const eventId = this.selectedEvent()?.eventId;
    console.log('Booking seats:', seatIds, 'for event:', eventId);
    // Navigate to queue/booking flow
    alert(`Booking ${seatIds.length} seats for event ${eventId}`);
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return 'TBD';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
