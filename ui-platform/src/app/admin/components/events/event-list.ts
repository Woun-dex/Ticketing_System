import { Component, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../services/admin.service';
import { Event, EventStatus } from '../../models/admin.models';

@Component({
  selector: 'app-event-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './event-list.html',
  styles: ``
})
export class EventList implements OnInit {
  searchQuery = '';
  statusFilter = '';
  typeFilter = '';

  constructor(public adminService: AdminService) {}

  filteredEvents = computed(() => {
    let events = this.adminService.events();
    
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      events = events.filter(e => e.name.toLowerCase().includes(query));
    }
    
    if (this.statusFilter) {
      events = events.filter(e => e.status === this.statusFilter);
    }
    
    if (this.typeFilter) {
      events = events.filter(e => e.type.toLowerCase() === this.typeFilter.toLowerCase());
    }
    
    return events;
  });

  ngOnInit(): void {
    this.adminService.getAllEvents().subscribe();
  }

  getStatusClass(status: EventStatus): string {
    const classes: Record<string, string> = {
      'DRAFT': 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
      'PUBLISHED': 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
      'ARCHIVED': 'bg-gray-500/20 text-gray-400 border border-gray-500/30',
      'CANCELLED': 'bg-red-500/20 text-red-400 border border-red-500/30'
    };
    return classes[status] || 'bg-gray-500/20 text-gray-400';
  }

  getEventBgClass(type: string): string {
    const classes: Record<string, string> = {
      'concert': 'bg-gradient-to-br from-indigo-600 to-purple-600',
      'sports': 'bg-gradient-to-br from-emerald-600 to-teal-600',
      'theater': 'bg-gradient-to-br from-purple-600 to-indigo-600',
      'conference': 'bg-gradient-to-br from-indigo-600 to-blue-600'
    };
    return classes[type.toLowerCase()] || 'bg-gradient-to-br from-gray-600 to-gray-700';
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  formatTime(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  deleteEvent(id: number, event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    
    if (confirm('Are you sure you want to delete this event?')) {
      this.adminService.deleteEvent(id).subscribe();
    }
  }
}
