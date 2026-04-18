import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  username = '';
  password = '';
  showPassword = false;
  loading = false;
  errorMsg = '';

  bubbles = Array.from({ length: 12 }, () => ({
    width:  (20 + Math.random() * 60) + 'px',
    left:   Math.random() * 100 + '%',
    animationDuration: (8 + Math.random() * 14) + 's',
    animationDelay:    Math.random() * 12 + 's'
  }));

  constructor(private auth: AuthService, private router: Router) {}

  submit() {
    if (!this.username.trim() || !this.password) {
      this.errorMsg = 'Please fill in all fields.';
      return;
    }
    this.loading = true;
    this.errorMsg = '';
    this.auth.login({ username: this.username.trim(), password: this.password }).subscribe({
      next: () => this.router.navigate(['/home']),
      error: (e: any) => {
        this.loading = false;
        this.errorMsg = e?.error?.message || 'Invalid username or password.';
      }
    });
  }
}
