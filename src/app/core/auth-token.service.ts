import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AuthTokenService {
  private k = 'bb_access';
  get token() { return localStorage.getItem(this.k); }
  set token(v: string | null) { v ? localStorage.setItem(this.k, v) : localStorage.removeItem(this.k); }
  clear() { localStorage.removeItem(this.k); }
}
