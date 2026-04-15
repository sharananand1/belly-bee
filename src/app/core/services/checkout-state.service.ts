import { Injectable, signal } from '@angular/core';
import { Address } from '../../models/address.model';
import { CouponResult } from '../../models/coupon.model';

const KEY = 'bb_checkout';

export interface CheckoutState {
  delivery_address?: Address;
  coupon_result?: CouponResult | null;
  subtotal?: number;
  delivery_fee?: number;
  gst?: number;
  total?: number;
}

@Injectable({ providedIn: 'root' })
export class CheckoutStateService {
  private _state = signal<CheckoutState>(this._load());

  get state(): CheckoutState { return this._state(); }

  patch(partial: Partial<CheckoutState>): void {
    const next = { ...this._state(), ...partial };
    this._state.set(next);
    try { sessionStorage.setItem(KEY, JSON.stringify(next)); } catch { /* ignore */ }
  }

  clear(): void {
    this._state.set({});
    try { sessionStorage.removeItem(KEY); } catch { /* ignore */ }
  }

  private _load(): CheckoutState {
    try {
      const raw = sessionStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
  }
}
