import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../../services/auth.service';

export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    // In a real app, you'd also check for admin role
    // For now, we just check authentication
    return true;
  }

  router.navigate(['/login']);
  return false;
};
