import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { ApiResponse, AuthResponse, LoginRequest, RegisterRequest } from '../models/models';

const TOKEN_KEY = 'cb_jwt';
const USER_KEY  = 'cb_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
private api = '/api/auth';

  constructor(private http: HttpClient, private router: Router) {}

  /**
   * The Spring Boot server may return either:
   *   { data: { token, username, ... } }   ← wrapped
   *   { token, username, ... }             ← direct
   * This helper normalises both shapes.
   */
  private unwrapAuth(body: any): AuthResponse {
    // Wrapped shape
    if (body && body.data && body.data.token) return body.data as AuthResponse;
    // Direct shape
    if (body && body.token) return body as AuthResponse;
    throw new Error('Unexpected auth response shape');
  }

  register(req: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<any>(`${this.api}/register`, req).pipe(
      map(body => this.unwrapAuth(body)),
      tap(auth  => this.persist(auth)),
      catchError(err => throwError(() => err))
    );
  }

  login(req: LoginRequest): Observable<AuthResponse> {
    return this.http.post<any>(`${this.api}/login`, req).pipe(
      map(body => this.unwrapAuth(body)),
      tap(auth  => this.persist(auth)),
      catchError(err => throwError(() => err))
    );
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  getUsername(): string | null {
    return localStorage.getItem(USER_KEY);
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    if (!token) return false;
    // Basic JWT expiry check — avoids 401 loops from expired tokens
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        this.logout();
        return false;
      }
    } catch { /* non-JWT or malformed — trust the token as-is */ }
    return true;
  }

  private persist(auth: AuthResponse): void {
    if (!auth?.token) return;
    localStorage.setItem(TOKEN_KEY, auth.token);
    localStorage.setItem(USER_KEY, auth.username ?? '');
  }
}
