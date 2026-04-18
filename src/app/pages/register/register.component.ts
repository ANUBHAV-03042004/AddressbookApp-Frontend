import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
  username  = '';
  email     = '';
  password  = '';
  confirm   = '';
  showPass  = false;
  showConf  = false;
  loading   = false;
  errorMsg  = '';
  successMsg = '';

  bubbles = Array.from({ length: 12 }, () => ({
    width:  (20 + Math.random() * 60) + 'px',
    left:   Math.random() * 100 + '%',
    animationDuration: (8 + Math.random() * 14) + 's',
    animationDelay:    Math.random() * 12 + 's'
  }));

  constructor(private auth: AuthService, private router: Router) {}

  get passwordStrength(): { level: number; label: string; color: string } {
    const p = this.password;
    if (!p) return { level: 0, label: '', color: '' };
    let score = 0;
    if (p.length >= 6)  score++;
    if (p.length >= 10) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    if (score <= 1) return { level: 1, label: 'Weak',   color: '#E53935' };
    if (score <= 3) return { level: 2, label: 'Medium', color: '#FF7043' };
    return             { level: 3, label: 'Strong', color: '#2E7D32' };
  }

  submit() {
    this.errorMsg = '';
    if (!this.username.trim() || !this.email.trim() || !this.password || !this.confirm) {
      this.errorMsg = 'Please fill in all fields.'; return;
    }
    if (this.password !== this.confirm) {
      this.errorMsg = 'Passwords do not match.'; return;
    }
    if (this.password.length < 6) {
      this.errorMsg = 'Password must be at least 6 characters.'; return;
    }
    this.loading = true;
    this.auth.register({
      username: this.username.trim(),
      email:    this.email.trim(),
      password: this.password
    }).subscribe({
      next: () => this.router.navigate(['/home']),
      error: (e: any) => {
        this.loading = false;
        this.errorMsg = e?.error?.message || 'Registration failed. Try again.';
      }
    });
  }
}
