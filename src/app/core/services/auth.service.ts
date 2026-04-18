import { Injectable, inject } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiService } from '../api.service';
import { AuthTokenService } from '../auth-token.service';
import { MockDataService } from '../mock/mock-data.service';
import { User } from '../../models/user.model';

export interface OtpRequestResult {
  success: boolean;
  message: string;
  expires_in: number;
}

export interface LoginResult {
  token: string;
  user: User;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = inject(ApiService);
  private tokens = inject(AuthTokenService);
  private mock = inject(MockDataService);

  /** Send OTP to phone number. Returns expiry in seconds. */
  requestOtp(phone: string): Observable<OtpRequestResult> {
    if (environment.useMock) {
      return of({ success: true, message: 'OTP sent to ' + phone, expires_in: 30 }).pipe(delay(800));
    }
    return this.api.post<OtpRequestResult>('/auth/otp/request', { phone });
  }

  /** Verify OTP and receive JWT. Persists token + user. */
  verifyOtp(phone: string, otp: string): Observable<LoginResult> {
    if (environment.useMock) {
      if (otp === '123456' || otp.length === 6) {
        const user = this.mock.getMockUser();
        const result: LoginResult = { token: 'mock_bb_token_dev_' + Date.now(), user };
        this.tokens.token = result.token;
        localStorage.setItem('bb_user', JSON.stringify(user));
        return of(result).pipe(delay(1000));
      }
      return throwError(() => ({ status: 400, error: { message: 'Invalid OTP. Use any 6-digit code in mock mode.' } }));
    }
    return this.api.post<LoginResult>('/auth/otp/verify', { phone, otp }).pipe(
      tap(result => {
        this.tokens.token = result.token;
        localStorage.setItem('bb_user', JSON.stringify(result.user));
      })
    );
  }

  /** Fetch the currently authenticated user profile. */
  getProfile(): Observable<User> {
    if (environment.useMock) {
      return of(this.mock.getMockUser()).pipe(delay(300));
    }
    return this.api.get<User>('/auth/profile');
  }

  /** Update user display name. */
  updateProfile(data: Partial<Pick<User, 'name' | 'email'>>): Observable<User> {
    if (environment.useMock) {
      const user = { ...this.mock.getMockUser(), ...data };
      localStorage.setItem('bb_user', JSON.stringify(user));
      return of(user).pipe(delay(400));
    }
    return this.api.put<User>('/auth/profile', data);
  }

  logout(): void {
    this.tokens.clear();
  }

  isLoggedIn(): boolean {
    return this.tokens.isLoggedIn();
  }

  getCachedUser(): User | null {
    const raw = localStorage.getItem('bb_user');
    return raw ? (JSON.parse(raw) as User) : null;
  }
}
