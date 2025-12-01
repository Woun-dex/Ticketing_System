import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.html',
})
export class Register {
  username = '';
  email = '';
  password = '';
  confirmPassword = '';
  acceptTerms = false;

  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  showPassword = signal(false);
  showConfirmPassword = signal(false);

  constructor(private authService: AuthService, private router: Router) {}

  togglePassword(): void {
    this.showPassword.update((v) => !v);
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword.update((v) => !v);
  }

  validateForm(): boolean {
    if (!this.username || !this.email || !this.password) {
      this.errorMessage.set('Please fill in all required fields');
      return false;
    }

    if (!this.email.includes('@')) {
      this.errorMessage.set('Please enter a valid email address');
      return false;
    }

    if (this.password.length < 6) {
      this.errorMessage.set('Password must be at least 6 characters long');
      return false;
    }

    if (this.password !== this.confirmPassword) {
      this.errorMessage.set('Passwords do not match');
      return false;
    }

    if (!this.acceptTerms) {
      this.errorMessage.set('Please accept the terms and conditions');
      return false;
    }

    return true;
  }

  onSubmit(): void {
    if (!this.validateForm()) {
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.authService
      .register({
        username: this.username,
        email: this.email,
        password: this.password,
      })
      .subscribe({
        next: () => {
          this.isLoading.set(false);
          this.router.navigate(['/queue']);
        },
        error: (error) => {
          this.isLoading.set(false);
          this.errorMessage.set(
            error.error?.message || error.message || 'Registration failed. Please try again.'
          );
        },
      });
  }
}
