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
    <div class="page-gradient-radial">
      <!-- Header -->
      <header class="navbar">
        <div class="container-app">
          <div class="flex items-center justify-between py-4">
            <!-- Logo -->
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"/>
                </svg>
              </div>
              <div>
                <h1 class="text-xl font-bold text-white">TicketHub</h1>
                <p class="text-xs text-gray-400">Find your next event</p>
              </div>
            </div>
            
            <!-- User Menu -->
            <div class="flex items-center gap-4">
              <div class="hidden sm:flex items-center gap-2 px-4 py-2 glass-card">
                <div class="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-sm font-bold text-gray-900">
                  {{ user()?.username?.charAt(0)?.toUpperCase() || 'U' }}
                </div>
                <span class="text-gray-200 text-sm font-medium">{{ user()?.username }}</span>
              </div>
              <button (click)="logout()" class="btn-ghost text-sm">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                </svg>
                <span class="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <main class="container-app py-8">
        <!-- Hero Section -->
        <div class="text-center mb-10 fade-in">
          <h2 class="text-4xl md:text-5xl font-bold text-white mb-4">
            Discover <span class="gradient-text">Amazing Events</span>
          </h2>
          <p class="text-gray-400 text-lg max-w-2xl mx-auto">
            Find and book tickets for concerts, sports, theater, and more. Your next unforgettable experience is just a click away.
          </p>
        </div>

        <!-- Search Section -->
        <div class="glass-card p-6 mb-8 slide-up">
          <div class="flex flex-col sm:flex-row gap-4">
            <div class="flex-1 relative">
              <svg class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
              <input 
                type="text" 
                [(ngModel)]="searchQuery"
                (keyup.enter)="searchEvents()"
                placeholder="Search events by name..."
                class="input-field pl-12"
              />
            </div>
            <button (click)="searchEvents()" class="btn-accent whitespace-nowrap">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
              Search Events
            </button>
          </div>
        </div>

        <!-- Loading State -->
        @if (loading()) {
          <div class="flex flex-col items-center justify-center py-20">
            <div class="spinner mb-4"></div>
            <p class="text-gray-400">Loading events...</p>
          </div>
        }

        <!-- Error State -->
        @if (error()) {
          <div class="glass-card p-8 text-center border-red-500/30">
            <div class="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
              <svg class="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
            </div>
            <p class="text-red-400 mb-4">{{ error() }}</p>
            <button (click)="loadEvents()" class="btn-primary">Try Again</button>
          </div>
        }

        <!-- Events Grid -->
        @if (!loading() && !error()) {
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            @for (event of events(); track event.id; let i = $index) {
              <div class="glass-card overflow-hidden event-card-hover fade-in" [style.animation-delay]="(i * 50) + 'ms'">
                <!-- Event Header with Gradient -->
                <div class="h-32 relative bg-gradient-to-br from-indigo-600/40 to-purple-700/40">
                  <div class="absolute inset-0 bg-gradient-to-t from-gray-900/90 to-transparent"></div>
                  
                  <!-- Event Type Badge -->
                  <div class="absolute top-4 left-4">
                    <span class="badge badge-info capitalize">{{ event.type }}</span>
                  </div>
                  
                  <!-- Status Badge -->
                  <div class="absolute top-4 right-4">
                    <span [class]="getStatusBadgeClass(event.status)">
                      {{ event.status }}
                    </span>
                  </div>
                  
                  <!-- Availability Indicator -->
                  <div class="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <div class="w-2 h-2 rounded-full" [class]="event.availableSeats > 0 ? 'bg-emerald-400' : 'bg-red-400'"></div>
                      <span class="text-sm text-gray-200">{{ event.availableSeats }} seats left</span>
                    </div>
                  </div>
                </div>

                <!-- Event Content -->
                <div class="p-5">
                  <h3 class="text-lg font-bold text-white mb-3 line-clamp-1">{{ event.name }}</h3>
                  
                  <div class="space-y-2 mb-4">
                    <div class="flex items-center gap-3 text-gray-400 text-sm">
                      <svg class="w-4 h-4 text-indigo-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                      </svg>
                      <span>{{ formatDate(event.startTime) }}</span>
                    </div>
                    <div class="flex items-center gap-3 text-gray-400 text-sm">
                      <svg class="w-4 h-4 text-amber-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"/>
                      </svg>
                      <span>{{ event.availableSeats }} / {{ event.totalSeats }} available</span>
                    </div>
                  </div>
                  
                  <!-- Progress Bar -->
                  <div class="mb-4">
                    <div class="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div class="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                           [style.width]="getAvailabilityPercentage(event) + '%'"></div>
                    </div>
                  </div>

                  <!-- Action Button -->
                  <button 
                    (click)="joinEvent(event)"
                    [disabled]="event.availableSeats === 0"
                    [class]="event.availableSeats > 0 ? 'btn-accent w-full' : 'btn-ghost w-full opacity-50 cursor-not-allowed'">
                    @if (event.availableSeats > 0) {
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"/>
                      </svg>
                      Join Queue
                    } @else {
                      Sold Out
                    }
                  </button>
                </div>
              </div>
            } @empty {
              <div class="col-span-full glass-card p-12 text-center">
                <div class="w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center mx-auto mb-4">
                  <svg class="w-10 h-10 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                  </svg>
                </div>
                <h3 class="text-xl font-semibold text-white mb-2">No Events Found</h3>
                <p class="text-gray-400 mb-6">Check back later for upcoming events or try a different search.</p>
                <button (click)="loadEvents()" class="btn-primary">Refresh Events</button>
              </div>
            }
          </div>
        }
      </main>
    </div>
  `
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
    if (!dateStr) return 'TBA';
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getStatusBadgeClass(status: string): string {
    const baseClass = 'badge ';
    switch (status?.toLowerCase()) {
      case 'published': return baseClass + 'badge-success';
      case 'draft': return baseClass + 'badge-warning';
      case 'cancelled': return baseClass + 'badge-error';
      default: return baseClass + 'badge-neutral';
    }
  }

  getAvailabilityPercentage(event: EventDocument): number {
    if (!event.totalSeats) return 0;
    return (event.availableSeats / event.totalSeats) * 100;
  }

  logout(): void {
    this.authService.logout();
  }
}
