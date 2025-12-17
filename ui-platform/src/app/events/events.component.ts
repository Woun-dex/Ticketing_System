import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SearchService, EventDocument } from '../services/search.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-events',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="events-page">
      <header class="header">
        <div class="header-content">
          <h1>🎫 Upcoming Events</h1>
          <div class="user-info">
            <span>Welcome, {{ user()?.username }}</span>
            <button class="logout-btn" (click)="logout()">Logout</button>
          </div>
        </div>
      </header>

      <div class="container">
        <div class="search-section">
          <input 
            type="text" 
            [(ngModel)]="searchQuery"
            (keyup.enter)="searchEvents()"
            placeholder="Search events..."
            class="search-input"
          />
          <button (click)="searchEvents()" class="search-btn">🔍 Search</button>
        </div>

        @if (loading()) {
          <div class="loading">
            <div class="spinner"></div>
            <p>Loading events...</p>
          </div>
        }

        @if (error()) {
          <div class="error">
            <p>{{ error() }}</p>
            <button (click)="loadEvents()">Try Again</button>
          </div>
        }

        @if (!loading() && !error()) {
          <div class="events-grid">
            @for (event of events(); track event.id) {
              <div class="event-card" [class.sold-out]="event.availableSeats === 0">
                <div class="event-badge">{{ event.type }}</div>
                <h3>{{ event.name }}</h3>
                <div class="event-info">
                  <p><span>📅</span> {{ formatDate(event.startTime) }}</p>
                  <p><span>🎟️</span> {{ event.availableSeats }} / {{ event.totalSeats }} seats available</p>
                </div>
                <div class="event-status" [class]="event.status.toLowerCase()">
                  {{ event.status }}
                </div>
                <button 
                  class="join-btn"
                  [disabled]="event.availableSeats === 0"
                  (click)="joinEvent(event)">
                  {{ event.availableSeats > 0 ? 'Join Queue' : 'Sold Out' }}
                </button>
              </div>
            } @empty {
              <div class="no-events">
                <p>No events found</p>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .events-page {
      min-height: 100vh;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
    }

    .header {
      background: rgba(255,255,255,0.1);
      backdrop-filter: blur(10px);
      padding: 1rem 2rem;
      border-bottom: 1px solid rgba(255,255,255,0.1);
    }

    .header-content {
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .header h1 {
      color: white;
      font-size: 1.5rem;
      margin: 0;
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 1rem;
      color: white;
    }

    .logout-btn {
      padding: 0.5rem 1rem;
      background: rgba(255,255,255,0.2);
      border: 1px solid rgba(255,255,255,0.3);
      color: white;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s;
    }

    .logout-btn:hover {
      background: rgba(255,255,255,0.3);
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
    }

    .search-section {
      display: flex;
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .search-input {
      flex: 1;
      padding: 1rem 1.5rem;
      border: none;
      border-radius: 12px;
      font-size: 1rem;
      background: rgba(255,255,255,0.1);
      color: white;
    }

    .search-input::placeholder {
      color: rgba(255,255,255,0.5);
    }

    .search-input:focus {
      outline: none;
      background: rgba(255,255,255,0.15);
    }

    .search-btn {
      padding: 1rem 2rem;
      background: #fcc200;
      border: none;
      border-radius: 12px;
      font-size: 1rem;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.3s;
    }

    .search-btn:hover {
      background: #e6b000;
      transform: translateY(-2px);
    }

    .loading {
      text-align: center;
      padding: 4rem;
      color: white;
    }

    .spinner {
      width: 50px;
      height: 50px;
      border: 4px solid rgba(255,255,255,0.2);
      border-top-color: #fcc200;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .error {
      text-align: center;
      padding: 2rem;
      background: rgba(255,0,0,0.1);
      border-radius: 12px;
      color: #ff6b6b;
    }

    .events-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 1.5rem;
    }

    .event-card {
      background: rgba(255,255,255,0.05);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 16px;
      padding: 1.5rem;
      transition: all 0.3s;
    }

    .event-card:hover {
      transform: translateY(-5px);
      border-color: #fcc200;
      box-shadow: 0 10px 40px rgba(252, 194, 0, 0.2);
    }

    .event-card.sold-out {
      opacity: 0.6;
    }

    .event-badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      background: rgba(252, 194, 0, 0.2);
      color: #fcc200;
      border-radius: 20px;
      font-size: 0.8rem;
      margin-bottom: 1rem;
    }

    .event-card h3 {
      color: white;
      font-size: 1.25rem;
      margin: 0 0 1rem 0;
    }

    .event-info {
      margin-bottom: 1rem;
    }

    .event-info p {
      color: rgba(255,255,255,0.7);
      margin: 0.5rem 0;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .event-status {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.8rem;
      margin-bottom: 1rem;
    }

    .event-status.published {
      background: rgba(39, 174, 96, 0.2);
      color: #27ae60;
    }

    .event-status.upcoming {
      background: rgba(241, 196, 15, 0.2);
      color: #f1c40f;
    }

    .join-btn {
      width: 100%;
      padding: 1rem;
      background: linear-gradient(135deg, #fcc200 0%, #f39c12 100%);
      border: none;
      border-radius: 12px;
      color: #1a1a2e;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s;
    }

    .join-btn:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 5px 20px rgba(252, 194, 0, 0.4);
    }

    .join-btn:disabled {
      background: rgba(255,255,255,0.1);
      color: rgba(255,255,255,0.5);
      cursor: not-allowed;
    }

    .no-events {
      text-align: center;
      padding: 4rem;
      color: rgba(255,255,255,0.5);
    }
  `]
})
export class EventsComponent implements OnInit {
  events = signal<EventDocument[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  searchQuery = '';

  user = computed(() => this.authService.user());

  constructor(
    private searchService: SearchService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadEvents();
  }

  loadEvents(): void {
    this.loading.set(true);
    this.error.set(null);

    this.searchService.getAvailableEvents().subscribe({
      next: (events) => {
        this.events.set(events);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load events');
        this.loading.set(false);
        console.error(err);
      }
    });
  }

  searchEvents(): void {
    if (!this.searchQuery.trim()) {
      this.loadEvents();
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
        this.error.set('Search failed');
        this.loading.set(false);
        console.error(err);
      }
    });
  }

  joinEvent(event: EventDocument): void {
    this.router.navigate(['/queue', event.id]);
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  logout(): void {
    this.authService.logout();
  }
}
