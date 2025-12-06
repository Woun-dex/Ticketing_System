import { Routes } from '@angular/router';
import { adminGuard } from './guards/admin.guard';

export const adminRoutes: Routes = [
  {
    path: '',
    canActivate: [adminGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./components/dashboard/admin-dashboard').then(m => m.AdminDashboard)
      },
      {
        path: 'events',
        loadComponent: () => import('./components/events/event-list').then(m => m.EventList)
      },
      {
        path: 'events/create',
        loadComponent: () => import('./components/events/event-form').then(m => m.EventForm)
      },
      {
        path: 'events/:id',
        loadComponent: () => import('./components/event-details').then(m => m.EventDetails)
      },
      {
        path: 'events/:id/edit',
        loadComponent: () => import('./components/events/event-form').then(m => m.EventForm)
      }
    ]
  }
];
