import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminService } from '../../services/admin.service';
import { EventRequest } from '../../models/admin.models';

@Component({
  selector: 'app-event-form',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  template: `
    <div class="min-h-screen bg-gray-900">
      <!-- Header -->
      <header class="bg-gray-800 border-b border-gray-700">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div class="flex items-center gap-4">
            <a routerLink="/admin/events" class="text-gray-400 hover:text-white transition-colors">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
              </svg>
            </a>
            <h1 class="text-2xl font-bold text-white">{{ isEditMode() ? 'Edit Event' : 'Create New Event' }}</h1>
          </div>
        </div>
      </header>

      <!-- Form -->
      <main class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form [formGroup]="eventForm" (ngSubmit)="onSubmit()" class="space-y-6">
          <!-- Basic Information -->
          <div class="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h2 class="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <svg class="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              Basic Information
            </h2>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Event Name -->
              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-300 mb-2">
                  Event Name <span class="text-red-400">*</span>
                </label>
                <input type="text" 
                       formControlName="name"
                       placeholder="Enter event name..."
                       class="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                       [class.border-red-500]="eventForm.get('name')?.invalid && eventForm.get('name')?.touched">
                @if (eventForm.get('name')?.invalid && eventForm.get('name')?.touched) {
                  <p class="mt-1 text-sm text-red-400">Event name is required</p>
                }
              </div>

              <!-- Event Type -->
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">
                  Event Type <span class="text-red-400">*</span>
                </label>
                <select formControlName="type"
                        class="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                        [class.border-red-500]="eventForm.get('type')?.invalid && eventForm.get('type')?.touched">
                  <option value="">Select type...</option>
                  <option value="concert">Concert</option>
                  <option value="sports">Sports</option>
                  <option value="theater">Theater</option>
                  <option value="conference">Conference</option>
                  <option value="other">Other</option>
                </select>
                @if (eventForm.get('type')?.invalid && eventForm.get('type')?.touched) {
                  <p class="mt-1 text-sm text-red-400">Event type is required</p>
                }
              </div>
            </div>
          </div>

          <!-- Date & Time -->
          <div class="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h2 class="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <svg class="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
              Date & Time
            </h2>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Start Time -->
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">
                  Start Time <span class="text-red-400">*</span>
                </label>
                <input type="datetime-local" 
                       formControlName="startTime"
                       class="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                       [class.border-red-500]="eventForm.get('startTime')?.invalid && eventForm.get('startTime')?.touched">
                @if (eventForm.get('startTime')?.invalid && eventForm.get('startTime')?.touched) {
                  <p class="mt-1 text-sm text-red-400">Start time is required</p>
                }
              </div>

              <!-- End Time -->
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">
                  End Time <span class="text-red-400">*</span>
                </label>
                <input type="datetime-local" 
                       formControlName="endTime"
                       class="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                       [class.border-red-500]="eventForm.get('endTime')?.invalid && eventForm.get('endTime')?.touched">
                @if (eventForm.get('endTime')?.invalid && eventForm.get('endTime')?.touched) {
                  <p class="mt-1 text-sm text-red-400">End time is required</p>
                }
              </div>
            </div>
          </div>

          <!-- Error Message -->
          @if (adminService.error()) {
            <div class="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <div class="flex items-center gap-3">
                <svg class="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <p class="text-red-400">{{ adminService.error() }}</p>
              </div>
            </div>
          }

          <!-- Submit Buttons -->
          <div class="flex items-center justify-end gap-4">
            <a routerLink="/admin/events" 
               class="px-6 py-3 bg-gray-700 text-white font-medium rounded-lg hover:bg-gray-600 transition-colors">
              Cancel
            </a>
            <button type="submit" 
                    [disabled]="eventForm.invalid || adminService.loading()"
                    class="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
              @if (adminService.loading()) {
                <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              }
              {{ isEditMode() ? 'Update Event' : 'Create Event' }}
            </button>
          </div>
        </form>
      </main>
    </div>
  `,
  styles: ``
})
export class EventForm implements OnInit {
  eventForm: FormGroup;
  isEditMode = signal(false);
  eventId = signal<number | null>(null);

  constructor(
    private fb: FormBuilder,
    public adminService: AdminService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.eventForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      type: ['', Validators.required],
      startTime: ['', Validators.required],
      endTime: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && this.route.snapshot.url.some(segment => segment.path === 'edit')) {
      this.isEditMode.set(true);
      this.eventId.set(Number(id));
      this.loadEvent(Number(id));
    }
  }

  loadEvent(id: number): void {
    this.adminService.getEvent(id).subscribe({
      next: (event) => {
        this.eventForm.patchValue({
          name: event.name,
          type: event.type,
          startTime: this.formatDateTimeLocal(event.startTime),
          endTime: this.formatDateTimeLocal(event.endTime)
        });
      }
    });
  }

  formatDateTimeLocal(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().slice(0, 16);
  }

  onSubmit(): void {
    if (this.eventForm.invalid) return;

    const formValue = this.eventForm.value;
    const request: EventRequest = {
      name: formValue.name,
      type: formValue.type,
      startTime: new Date(formValue.startTime).toISOString(),
      endTime: new Date(formValue.endTime).toISOString()
    };

    if (this.isEditMode() && this.eventId()) {
      this.adminService.updateEvent(this.eventId()!, request).subscribe({
        next: () => {
          this.router.navigate(['/admin/events', this.eventId()]);
        }
      });
    } else {
      this.adminService.createEvent(request).subscribe({
        next: (event) => {
          this.router.navigate(['/admin/events', event.id]);
        }
      });
    }
  }
}
