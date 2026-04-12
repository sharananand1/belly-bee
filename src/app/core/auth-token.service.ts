import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AuthTokenService {
  private readonly KEY = 'bb_token';

  get token(): string | null {
    return localStorage.getItem(this.KEY);
  }

  set token(value: string | null) {
    if (value) {
      localStorage.setItem(this.KEY, value);
    } else {
      localStorage.removeItem(this.KEY);
    }
  }

  clear(): void {
    localStorage.removeItem(this.KEY);
    localStorage.removeItem('bb_user');
  }

  isLoggedIn(): boolean {
    return !!this.token;
  }
}
