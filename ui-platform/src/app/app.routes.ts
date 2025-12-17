import { Routes } from '@angular/router';
import { authGuard, guestGuard, adminGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'events',
    pathMatch: 'full',
  },
  {
    path: 'events',
    loadComponent: () => import('./events/events.component').then((m) => m.EventsComponent),
    canActivate: [authGuard],
  },
  {
    path: 'search',
    loadComponent: () => import('./search/search.component').then((m) => m.SearchComponent),
  },
  {
    path: 'login',
    loadComponent: () => import('./auth/login/login').then((m) => m.Login),
    canActivate: [guestGuard],
  },
  {
    path: 'register',
    loadComponent: () => import('./auth/register/register').then((m) => m.Register),
    canActivate: [guestGuard],
  },
  {
    path: 'queue/:eventId',
    loadComponent: () => import('./queue/queue').then((m) => m.Queue),
    canActivate: [authGuard],
  },
  {
    path: 'seats/:eventId',
    loadComponent: () => import('./seats/seats.component').then((m) => m.SeatsComponent),
    canActivate: [authGuard],
  },
  {
    path: 'booking/confirmation/:orderId',
    loadComponent: () => import('./booking/confirmation.component').then((m) => m.BookingConfirmationComponent),
    canActivate: [authGuard],
  },
  {
    path: 'admin',
    loadChildren: () => import('./admin/admin.routes').then((m) => m.adminRoutes),
    canActivate: [adminGuard],
  },
  {
    path: '**',
    redirectTo: 'events',
  },
];
