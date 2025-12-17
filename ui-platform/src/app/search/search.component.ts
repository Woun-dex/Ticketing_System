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
    <div class="search-container">
      <header class="search-header">
        <h1>🎫 Find Events & Tickets</h1>
        <p>Search for events and check available seats</p>
      </header>

      <div class="search-box">
        <div class="search-input-group">
          <input 
            type="text" 
            [(ngModel)]="searchQuery"
            (keyup.enter)="searchEvents()"
            placeholder="Search events by name..."
            class="search-input"
          />
          <button (click)="searchEvents()" class="search-btn">
            🔍 Search
          </button>
        </div>
        
        <div class="filter-buttons">
          <button 
            (click)="loadAvailableEvents()" 
            class="filter-btn"
            [class.active]="currentFilter() === 'available'">
            ✅ Available Events
          </button>
          <button 
            (click)="loadAllEvents()" 
            class="filter-btn"
            [class.active]="currentFilter() === 'all'">
            📋 All Events
          </button>
        </div>
      </div>

      @if (loading()) {
        <div class="loading">
          <div class="spinner"></div>
          <p>Loading events...</p>
        </div>
      }

      @if (error()) {
        <div class="error-message">
          <p>⚠️ {{ error() }}</p>
          <button (click)="loadAllEvents()" class="retry-btn">Try Again</button>
        </div>
      }

      @if (!loading() && !error()) {
        <div class="events-grid">
          @for (event of events(); track event.id) {
            <div class="event-card" [class.no-seats]="event.availableSeats === 0">
              <div class="event-header">
                <span class="event-type">{{ event.type }}</span>
                <span class="event-status" [class]="event.status.toLowerCase()">
                  {{ event.status }}
                </span>
              </div>
              
              <h3 class="event-name">{{ event.name }}</h3>
              
              <div class="event-details">
                <div class="detail">
                  <span class="label">📅 Start</span>
                  <span class="value">{{ formatDate(event.startTime) }}</span>
                </div>
                <div class="detail">
                  <span class="label">🏁 End</span>
                  <span class="value">{{ formatDate(event.endTime) }}</span>
                </div>
              </div>
              
              <div class="seats-info">
                <div class="seats-available">
                  <span class="seats-number">{{ event.availableSeats }}</span>
                  <span class="seats-label">Available</span>
                </div>
                <div class="seats-total">
                  <span>of {{ event.totalSeats }} total</span>
                </div>
              </div>
              
              <button 
                (click)="viewEventSeats(event)"
                class="view-seats-btn"
                [disabled]="event.availableSeats === 0">
                {{ event.availableSeats > 0 ? '🎟️ View Seats' : 'Sold Out' }}
              </button>
            </div>
          } @empty {
            <div class="no-events">
              <p>🔍 No events found</p>
              <p>Try a different search or check back later</p>
            </div>
          }
        </div>
      }

      @if (selectedEvent()) {
        <div class="modal-overlay" (click)="closeModal()">
          <div class="modal-content" (click)="$event.stopPropagation()">
            <button class="close-btn" (click)="closeModal()">✕</button>
            
            <h2>{{ selectedEvent()?.eventName }}</h2>
            <p class="modal-subtitle">Available Seats: {{ selectedEvent()?.availableSeats }} / {{ selectedEvent()?.totalSeats }}</p>
            
            @if (loadingSeats()) {
              <div class="loading">
                <div class="spinner"></div>
              </div>
            } @else {
              <div class="seats-grid">
                @for (seat of selectedEvent()?.seats; track seat.id) {
                  <div 
                    class="seat" 
                    [class.available]="seat.status === 'AVAILABLE'"
                    [class.reserved]="seat.status === 'RESERVED'"
                    [class.sold]="seat.status === 'SOLD'"
                    [class.selected]="isSelected(seat)"
                    (click)="toggleSeatSelection(seat)">
                    <span class="seat-label">{{ seat.rowNumber }}{{ seat.seatNumber }}</span>
                    <span class="seat-price">\${{ seat.price }}</span>
                  </div>
                } @empty {
                  <p class="no-seats">No seats available</p>
                }
              </div>
              
              @if (selectedSeats().length > 0) {
                <div class="selection-summary">
                  <p>Selected: {{ selectedSeats().length }} seat(s)</p>
                  <p>Total: \${{ calculateTotal() }}</p>
                  <button class="book-btn" (click)="proceedToBooking()">
                    🎫 Proceed to Booking
                  </button>
                </div>
              }
            }
            
            <div class="legend">
              <div class="legend-item">
                <div class="legend-color available"></div>
                <span>Available</span>
              </div>
              <div class="legend-item">
                <div class="legend-color reserved"></div>
                <span>Reserved</span>
              </div>
              <div class="legend-item">
                <div class="legend-color sold"></div>
                <span>Sold</span>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .search-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
    }

    .search-header {
      text-align: center;
      margin-bottom: 2rem;
    }

    .search-header h1 {
      font-size: 2.5rem;
      color: #1a1a2e;
      margin-bottom: 0.5rem;
    }

    .search-header p {
      color: #666;
      font-size: 1.1rem;
    }

    .search-box {
      background: white;
      padding: 1.5rem;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.08);
      margin-bottom: 2rem;
    }

    .search-input-group {
      display: flex;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .search-input {
      flex: 1;
      padding: 1rem 1.5rem;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      font-size: 1rem;
      transition: border-color 0.3s;
    }

    .search-input:focus {
      outline: none;
      border-color: #6c5ce7;
    }

    .search-btn {
      padding: 1rem 2rem;
      background: #6c5ce7;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      cursor: pointer;
      transition: background 0.3s;
    }

    .search-btn:hover {
      background: #5b4cdb;
    }

    .filter-buttons {
      display: flex;
      gap: 0.5rem;
    }

    .filter-btn {
      padding: 0.75rem 1.5rem;
      background: #f5f5f5;
      border: none;
      border-radius: 20px;
      cursor: pointer;
      transition: all 0.3s;
    }

    .filter-btn:hover, .filter-btn.active {
      background: #6c5ce7;
      color: white;
    }

    .loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 3rem;
    }

    .spinner {
      width: 50px;
      height: 50px;
      border: 4px solid #f3f3f3;
      border-top: 4px solid #6c5ce7;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .error-message {
      text-align: center;
      padding: 2rem;
      background: #fff5f5;
      border-radius: 8px;
      color: #c0392b;
    }

    .retry-btn {
      margin-top: 1rem;
      padding: 0.75rem 1.5rem;
      background: #c0392b;
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
    }

    .events-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.5rem;
    }

    .event-card {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 4px 15px rgba(0,0,0,0.08);
      transition: transform 0.3s, box-shadow 0.3s;
    }

    .event-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 8px 25px rgba(0,0,0,0.12);
    }

    .event-card.no-seats {
      opacity: 0.7;
    }

    .event-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 1rem;
    }

    .event-type {
      background: #e8e5ff;
      color: #6c5ce7;
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.85rem;
    }

    .event-status {
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.85rem;
    }

    .event-status.active {
      background: #d4edda;
      color: #155724;
    }

    .event-status.upcoming {
      background: #fff3cd;
      color: #856404;
    }

    .event-name {
      font-size: 1.25rem;
      color: #1a1a2e;
      margin-bottom: 1rem;
    }

    .event-details {
      margin-bottom: 1rem;
    }

    .detail {
      display: flex;
      justify-content: space-between;
      padding: 0.5rem 0;
      border-bottom: 1px solid #f0f0f0;
    }

    .label {
      color: #666;
    }

    .value {
      color: #1a1a2e;
      font-weight: 500;
    }

    .seats-info {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem;
      background: #f8f9fa;
      border-radius: 8px;
      margin-bottom: 1rem;
    }

    .seats-available {
      display: flex;
      flex-direction: column;
    }

    .seats-number {
      font-size: 2rem;
      font-weight: bold;
      color: #27ae60;
    }

    .seats-label {
      font-size: 0.85rem;
      color: #666;
    }

    .seats-total {
      color: #666;
    }

    .view-seats-btn {
      width: 100%;
      padding: 1rem;
      background: #6c5ce7;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      cursor: pointer;
      transition: background 0.3s;
    }

    .view-seats-btn:hover:not(:disabled) {
      background: #5b4cdb;
    }

    .view-seats-btn:disabled {
      background: #ccc;
      cursor: not-allowed;
    }

    .no-events {
      grid-column: 1 / -1;
      text-align: center;
      padding: 3rem;
      color: #666;
    }

    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal-content {
      background: white;
      padding: 2rem;
      border-radius: 12px;
      max-width: 800px;
      width: 90%;
      max-height: 90vh;
      overflow-y: auto;
      position: relative;
    }

    .close-btn {
      position: absolute;
      top: 1rem;
      right: 1rem;
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      color: #666;
    }

    .modal-subtitle {
      color: #666;
      margin-bottom: 1.5rem;
    }

    .seats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
      gap: 0.5rem;
      margin-bottom: 1.5rem;
    }

    .seat {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 0.75rem;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .seat.available {
      background: #d4edda;
      border: 2px solid #28a745;
    }

    .seat.available:hover {
      background: #28a745;
      color: white;
    }

    .seat.reserved {
      background: #fff3cd;
      border: 2px solid #ffc107;
      cursor: not-allowed;
    }

    .seat.sold {
      background: #f8d7da;
      border: 2px solid #dc3545;
      cursor: not-allowed;
    }

    .seat.selected {
      background: #6c5ce7;
      border-color: #6c5ce7;
      color: white;
    }

    .seat-label {
      font-weight: bold;
      font-size: 0.9rem;
    }

    .seat-price {
      font-size: 0.75rem;
      opacity: 0.8;
    }

    .no-seats {
      grid-column: 1 / -1;
      text-align: center;
      color: #666;
    }

    .selection-summary {
      background: #f8f9fa;
      padding: 1rem;
      border-radius: 8px;
      margin-bottom: 1rem;
      text-align: center;
    }

    .book-btn {
      margin-top: 1rem;
      padding: 1rem 2rem;
      background: #27ae60;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      cursor: pointer;
    }

    .book-btn:hover {
      background: #219a52;
    }

    .legend {
      display: flex;
      justify-content: center;
      gap: 1.5rem;
      padding-top: 1rem;
      border-top: 1px solid #eee;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .legend-color {
      width: 20px;
      height: 20px;
      border-radius: 4px;
    }

    .legend-color.available {
      background: #d4edda;
      border: 2px solid #28a745;
    }

    .legend-color.reserved {
      background: #fff3cd;
      border: 2px solid #ffc107;
    }

    .legend-color.sold {
      background: #f8d7da;
      border: 2px solid #dc3545;
    }
  `]
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
