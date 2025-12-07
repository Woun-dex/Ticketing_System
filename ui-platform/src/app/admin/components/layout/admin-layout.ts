import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-layout.html'
})
export class AdminLayout {
  isMobileMenuOpen = false;

  constructor(public authService: AuthService) {}

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  getUserInitials(): string {
    const user = this.authService.user();
    if (user) {
      return `${user.username?.charAt(0) || ''}${user.username?.charAt(1) || ''}`.toUpperCase() || 'A';
    }
    return 'A';
  }

  logout(): void {
    this.authService.logout();
  }
}
