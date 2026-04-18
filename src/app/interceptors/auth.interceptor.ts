import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth  = inject(AuthService);
  const token = auth.getToken();

  // Attach Bearer token to every request that has one
  const cloned = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(cloned).pipe(
    catchError((err: HttpErrorResponse) => {
      const isAuthEndpoint = req.url.includes('/api/auth/');

      if (err.status === 401 && !isAuthEndpoint) {
        // Token rejected by server — clear local state and force re-login
        auth.logout();
      }

      if (err.status === 403 && !isAuthEndpoint) {
        // 403 usually means token is present but expired/invalid on server
        auth.logout();
      }

      return throwError(() => err);
    })
  );
};
