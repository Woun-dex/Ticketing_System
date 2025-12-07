import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AdminService } from '../../services/admin.service';
import { Event, EventStatus } from '../../models/admin.models';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-dashboard.html',
  styles: ``
})
export class AdminDashboard implements OnInit {
  constructor(public adminService: AdminService) {}

  totalEvents = computed(() => this.adminService.events().length);
  publishedEvents = computed(() => 
    this.adminService.events().filter(e => e.status === EventStatus.PUBLISHED).length
  );
  draftEvents = computed(() => 
    this.adminService.events().filter(e => e.status === EventStatus.DRAFT).length
  );
  cancelledEvents = computed(() => 
    this.adminService.events().filter(e => e.status === EventStatus.CANCELLED).length
  );
  recentEvents = computed(() => 
    this.adminService.events().slice(0, 5)
  );

  ngOnInit(): void {
    this.adminService.getAllEvents().subscribe();
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

  getEventTypeClass(type: string): string {
    const classes: Record<string, string> = {
      'concert': 'bg-purple-500/20 text-purple-400',
      'sports': 'bg-green-500/20 text-green-400',
      'theater': 'bg-pink-500/20 text-pink-400',
      'conference': 'bg-blue-500/20 text-blue-400'
    };
    return classes[type.toLowerCase()] || 'bg-gray-500/20 text-gray-400';
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
