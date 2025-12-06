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
  template: `
    <div class="min-h-screen bg-gray-900">
      <!-- Header -->
      <header class="bg-gray-800 border-b border-gray-700 sticky top-0 z-50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-4">
              <a routerLink="/admin/events" class="text-gray-400 hover:text-white transition-colors">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                </svg>
              </a>
              <div>
                <h1 class="text-2xl font-bold text-white">{{ event()?.name || 'Event Details' }}</h1>
                @if (event()) {
                  <div class="flex items-center gap-2 mt-1">
                    <span [class]="getStatusClass(event()!.status)" class="px-2 py-0.5 rounded text-xs font-medium">
                      {{ event()!.status }}
                    </span>
                    <span class="text-gray-400 text-sm capitalize">{{ event()!.type }}</span>
                  </div>
                }
              </div>
            </div>
            <div class="flex items-center gap-3">
              @if (event()?.status === 'DRAFT') {
                <button (click)="publishEvent()" 
                        [disabled]="adminService.loading() || !hasSeats()"
                        class="px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                  </svg>
                  Publish Event
                </button>
              }
              <a [routerLink]="['/admin/events', eventId(), 'edit']"
                 class="px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                </svg>
                Edit
              </a>
            </div>
          </div>
        </div>
      </header>

      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        @if (adminService.loading() && !event()) {
          <div class="flex items-center justify-center py-20">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
          </div>
        } @else if (event()) {
          <!-- Tabs -->
          <div class="flex items-center gap-1 mb-6 bg-gray-800 rounded-lg p-1 w-fit">
            <button (click)="activeTab.set('details')"
                    [class]="activeTab() === 'details' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'"
                    class="px-4 py-2 rounded-md font-medium transition-colors">
              Details
            </button>
            <button (click)="activeTab.set('seats')"
                    [class]="activeTab() === 'seats' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'"
                    class="px-4 py-2 rounded-md font-medium transition-colors">
              Seat Map
            </button>
            <button (click)="activeTab.set('seat-types')"
                    [class]="activeTab() === 'seat-types' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'"
                    class="px-4 py-2 rounded-md font-medium transition-colors">
              Seat Types
            </button>
            <button (click)="activeTab.set('generate')"
                    [class]="activeTab() === 'generate' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'"
                    class="px-4 py-2 rounded-md font-medium transition-colors">
              Generate Seats
            </button>
          </div>

          <!-- Details Tab -->
          @if (activeTab() === 'details') {
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <!-- Event Info Card -->
              <div class="lg:col-span-2 bg-gray-800 rounded-xl p-6 border border-gray-700">
                <h2 class="text-lg font-semibold text-white mb-6">Event Information</h2>
                
                <div class="grid grid-cols-2 gap-6">
                  <div>
                    <p class="text-gray-400 text-sm mb-1">Event Name</p>
                    <p class="text-white font-medium">{{ event()!.name }}</p>
                  </div>
                  <div>
                    <p class="text-gray-400 text-sm mb-1">Type</p>
                    <p class="text-white font-medium capitalize">{{ event()!.type }}</p>
                  </div>
                  <div>
                    <p class="text-gray-400 text-sm mb-1">Start Time</p>
                    <p class="text-white font-medium">{{ formatDateTime(event()!.startTime) }}</p>
                  </div>
                  <div>
                    <p class="text-gray-400 text-sm mb-1">End Time</p>
                    <p class="text-white font-medium">{{ formatDateTime(event()!.endTime) }}</p>
                  </div>
                  <div>
                    <p class="text-gray-400 text-sm mb-1">Status</p>
                    <span [class]="getStatusClass(event()!.status)" class="px-3 py-1 rounded text-sm font-medium">
                      {{ event()!.status }}
                    </span>
                  </div>
                  <div>
                    <p class="text-gray-400 text-sm mb-1">Seat Types</p>
                    <p class="text-white font-medium">{{ event()!.seatTypes?.length || 0 }} types configured</p>
                  </div>
                </div>
              </div>

              <!-- Stats Card -->
              <div class="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <h2 class="text-lg font-semibold text-white mb-6">Inventory Stats</h2>
                
                @if (inventory()) {
                  <div class="space-y-4">
                    <div class="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                      <span class="text-gray-300">Total Seats</span>
                      <span class="text-white font-bold text-xl">{{ inventory()!.totalSeats }}</span>
                    </div>
                    <div class="flex items-center justify-between p-3 bg-green-500/10 rounded-lg border border-green-500/30">
                      <span class="text-green-400">Available</span>
                      <span class="text-green-400 font-bold text-xl">{{ inventory()!.availableSeats }}</span>
                    </div>
                    <div class="flex items-center justify-between p-3 bg-red-500/10 rounded-lg border border-red-500/30">
                      <span class="text-red-400">Sold</span>
                      <span class="text-red-400 font-bold text-xl">{{ soldCount() }}</span>
                    </div>
                    <div class="flex items-center justify-between p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/30">
                      <span class="text-yellow-400">Reserved</span>
                      <span class="text-yellow-400 font-bold text-xl">{{ reservedCount() }}</span>
                    </div>
                  </div>
                } @else {
                  <p class="text-gray-400 text-center py-4">No inventory data yet</p>
                }
              </div>
            </div>
          }

          <!-- Seats Tab -->
          @if (activeTab() === 'seats') {
            <div class="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <div class="flex items-center justify-between mb-6">
                <div class="flex items-center gap-4">
                  <h2 class="text-lg font-semibold text-white">Seat Map</h2>
                  <!-- View Toggle -->
                  <div class="flex items-center gap-1 bg-gray-700 rounded-lg p-1">
                    <button (click)="seatViewMode.set('grid')"
                            [class]="seatViewMode() === 'grid' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'"
                            class="px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center gap-2">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/>
                      </svg>
                      Grid
                    </button>
                    <button (click)="seatViewMode.set('theater')"
                            [class]="seatViewMode() === 'theater' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'"
                            class="px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center gap-2">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"/>
                      </svg>
                      Theater
                    </button>
                  </div>
                </div>
                <button (click)="refreshInventory()" 
                        class="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-2">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                  </svg>
                  Refresh
                </button>
              </div>

              @if (inventory() && inventory()!.seats.length > 0) {
                @if (seatViewMode() === 'grid') {
                  <app-seat-map 
                    [seats]="inventory()!.seats"
                    [selectedSeatId]="selectedSeat()?.id || null"
                    [editMode]="true"
                    (seatClick)="onSeatClick($event)">
                  </app-seat-map>
                } @else {
                  <app-theater-seat-map 
                    [seats]="inventory()!.seats"
                    [selectedSeatId]="selectedSeat()?.id || null"
                    [editMode]="true"
                    (seatClick)="onSeatClick($event)">
                  </app-theater-seat-map>
                }

                <!-- Seat Edit Panel -->
                @if (selectedSeat()) {
                  <div class="mt-6 p-4 bg-gray-700 rounded-lg">
                    <h3 class="text-white font-medium mb-4">Edit Seat: Row {{ selectedSeat()!.row }}, Seat {{ selectedSeat()!.number }}</h3>
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <button (click)="updateSeatStatus(SeatStatus.AVAILABLE)"
                              [disabled]="selectedSeat()!.status === SeatStatus.AVAILABLE"
                              class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                        Available
                      </button>
                      <button (click)="updateSeatStatus(SeatStatus.BLOCKED)"
                              [disabled]="selectedSeat()!.status === SeatStatus.BLOCKED"
                              class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                        Blocked
                      </button>
                      <button (click)="updateSeatStatus(SeatStatus.RESERVED)"
                              [disabled]="selectedSeat()!.status === SeatStatus.RESERVED"
                              class="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                        Reserved
                      </button>
                      <button (click)="updateSeatStatus(SeatStatus.SOLD)"
                              [disabled]="selectedSeat()!.status === SeatStatus.SOLD"
                              class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                        Sold
                      </button>
                    </div>
                  </div>
                }
              } @else {
                <div class="text-center py-12">
                  <svg class="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"/>
                  </svg>
                  <p class="text-gray-400 mb-4">No seats generated yet</p>
                  <button (click)="activeTab.set('generate')" class="text-purple-400 hover:text-purple-300">
                    Generate seats →
                  </button>
                </div>
              }
            </div>
          }

          <!-- Seat Types Tab -->
          @if (activeTab() === 'seat-types') {
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <!-- Existing Seat Types -->
              <div class="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <h2 class="text-lg font-semibold text-white mb-6">Seat Types</h2>
                
                @if (event()!.seatTypes && event()!.seatTypes.length > 0) {
                  <div class="space-y-3">
                    @for (seatType of event()!.seatTypes; track seatType.id) {
                      <div class="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                        <div class="flex items-center gap-3">
                          <div class="w-10 h-10 rounded-lg flex items-center justify-center"
                               [class]="getSeatTypeColorClass(seatType.name)">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/>
                            </svg>
                          </div>
                          <div>
                            <p class="text-white font-medium">{{ seatType.name }}</p>
                            <p class="text-gray-400 text-sm">ID: {{ seatType.id }}</p>
                          </div>
                        </div>
                        <div class="text-right">
                          <p class="text-white font-bold">\${{ seatType.price }}</p>
                        </div>
                      </div>
                    }
                  </div>
                } @else {
                  <p class="text-gray-400 text-center py-4">No seat types configured</p>
                }
              </div>

              <!-- Add Seat Type Form -->
              <div class="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <h2 class="text-lg font-semibold text-white mb-6">Add Seat Type</h2>
                
                <form [formGroup]="seatTypeForm" (ngSubmit)="addSeatType()" class="space-y-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-300 mb-2">Name</label>
                    <input type="text" 
                           formControlName="name"
                           placeholder="e.g., VIP, Standard, Economy"
                           class="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-colors">
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-300 mb-2">Price</label>
                    <div class="relative">
                      <span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                      <input type="number" 
                             formControlName="price"
                             placeholder="0.00"
                             min="0"
                             step="0.01"
                             class="w-full pl-8 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-colors">
                    </div>
                  </div>
                  <button type="submit" 
                          [disabled]="seatTypeForm.invalid || adminService.loading()"
                          class="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                    Add Seat Type
                  </button>
                </form>
              </div>
            </div>
          }

          <!-- Generate Seats Tab -->
          @if (activeTab() === 'generate') {
            <div class="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h2 class="text-lg font-semibold text-white mb-6">Generate Seats</h2>
              
              @if (!event()!.seatTypes || event()!.seatTypes.length === 0) {
                <div class="text-center py-8">
                  <svg class="w-12 h-12 text-yellow-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                  </svg>
                  <p class="text-white font-medium mb-2">No seat types configured</p>
                  <p class="text-gray-400 mb-4">You need to add seat types before generating seats</p>
                  <button (click)="activeTab.set('seat-types')" class="text-purple-400 hover:text-purple-300">
                    Add seat types →
                  </button>
                </div>
              } @else {
                <form [formGroup]="seatGenForm" (ngSubmit)="generateSeats()" class="max-w-lg space-y-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-300 mb-2">Seat Type</label>
                    <select formControlName="seatTypeId"
                            class="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors">
                      <option value="">Select seat type...</option>
                      @for (seatType of event()!.seatTypes; track seatType.id) {
                        <option [value]="seatType.id">{{ seatType.name }} - \${{ seatType.price }}</option>
                      }
                    </select>
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-300 mb-2">Row Prefix</label>
                    <input type="text" 
                           formControlName="rowPrefix"
                           placeholder="e.g., A, B, VIP"
                           maxlength="5"
                           class="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-colors uppercase">
                    <p class="mt-1 text-xs text-gray-400">The row identifier (e.g., A, B, C or VIP1, VIP2)</p>
                  </div>

                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <label class="block text-sm font-medium text-gray-300 mb-2">Start Seat #</label>
                      <input type="number" 
                             formControlName="startSeatNumber"
                             placeholder="1"
                             min="1"
                             class="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-colors">
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-300 mb-2">End Seat #</label>
                      <input type="number" 
                             formControlName="endSeatNumber"
                             placeholder="20"
                             min="1"
                             class="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-colors">
                    </div>
                  </div>

                  <div class="bg-gray-700/50 rounded-lg p-4">
                    <p class="text-gray-300 text-sm">
                      This will generate <span class="text-white font-bold">{{ seatsToGenerate() }}</span> seats 
                      in row <span class="text-white font-bold">{{ seatGenForm.get('rowPrefix')?.value || '?' }}</span>
                    </p>
                  </div>

                  <button type="submit" 
                          [disabled]="seatGenForm.invalid || adminService.loading() || seatsToGenerate() <= 0"
                          class="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                    @if (adminService.loading()) {
                      <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    }
                    Generate Seats
                  </button>
                </form>
              }
            </div>
          }

          <!-- Success/Error Messages -->
          @if (successMessage()) {
            <div class="fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-in slide-in-from-right">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
              </svg>
              {{ successMessage() }}
            </div>
          }

          @if (adminService.error()) {
            <div class="fixed bottom-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
              {{ adminService.error() }}
            </div>
          }
        }
      </main>
    </div>
  `,
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
