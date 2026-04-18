import { Injectable, inject } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthTokenService } from '../auth-token.service';
import { ToastService } from '../services/toast.service';
import { KitchenService } from '../services/kitchen.service';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  private router   = inject(Router);
  private tokens   = inject(AuthTokenService);
  private toast    = inject(ToastService);
  private kitchen  = inject(KitchenService);

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {

        const serverMessage: string = error?.error?.message ?? '';

        switch (error.status) {
          case 401:
            this.tokens.clear();
            this.router.navigate(['/auth/login']);
            break;

          case 403:
            // Kitchen closed — mark it so the overlay appears
            if (serverMessage.toLowerCase().includes('closed') ||
                serverMessage.toLowerCase().includes('kitchen')) {
              this.kitchen.markClosed(serverMessage || undefined);
            }
            break;

          case 429:
            this.toast.warning('Too many requests, slow down!');
            break;

          case 500:
          case 502:
          case 503:
            this.toast.error('Something went wrong on our end. Please try again.');
            break;
        }

        return throwError(() => error);
      }),
    );
  }
}
