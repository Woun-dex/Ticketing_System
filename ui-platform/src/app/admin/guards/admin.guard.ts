import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../../services/auth.service';

export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    router.navigate(['/login']);
    return false;
  }

  // Check for ADMIN role
  if (!authService.isAdmin()) {
    console.warn('Access denied: User does not have ADMIN role');
    router.navigate(['/queue']);
    return false;
  }

  return true;
};
