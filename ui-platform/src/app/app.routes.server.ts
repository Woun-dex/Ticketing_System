import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'queue/:eventId',
    renderMode: RenderMode.Client
  },
  {
    path: 'seats/:eventId',
    renderMode: RenderMode.Client
  },
  {
    path: 'booking/confirmation/:orderId',
    renderMode: RenderMode.Client
  },
  {
    path: 'admin/**',
    renderMode: RenderMode.Client
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];
