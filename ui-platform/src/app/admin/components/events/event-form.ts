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
  templateUrl: './event-form.html',
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
