import { Injectable, inject, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { ApiService } from '../api.service';
import { environment } from '../../../environments/environment';

export interface KitchenStatus {
  is_open: boolean;
  opening_time: string;
  closing_time: string;
  closed_message: string | null;
  party_order_note: string;
  contact_mobile: string;
  whatsapp_link: string;
  estimated_delivery_minutes: number;
  message: string;
}

const MOCK_STATUS: KitchenStatus = {
  is_open: true,
  opening_time: '09:00',
  closing_time: '23:00',
  closed_message: null,
  party_order_note: 'Planning a party? Call us for bulk & special orders!',
  contact_mobile: '+918899888683',
  whatsapp_link: 'https://wa.me/918899888683',
  estimated_delivery_minutes: 40,
  message: 'We are open! Order now for fresh, hot food delivered to your door.',
};

// No party note until API responds — prevents banner CLS on first-time visits
const INITIAL_STATUS: KitchenStatus = { ...MOCK_STATUS, party_order_note: '' };

const CACHE_KEY = 'bb_kitchen_v1';

@Injectable({ providedIn: 'root' })
export class KitchenService {
  private api = inject(ApiService);

  // Read sessionStorage synchronously so return visits get the correct banner state
  // before Angular renders the first frame — eliminates the 0.165 CLS score
  private _status = signal<KitchenStatus>(KitchenService.readCache());
  private _loading      = signal(false);
  private _notifyLoading = signal(false);
  private _notifyDone    = signal(false);

  /** Read cached kitchen status (synchronous, zero CLS for returning visitors) */
  private static readCache(): KitchenStatus {
    try {
      const raw = sessionStorage.getItem(CACHE_KEY);
      if (raw) return JSON.parse(raw) as KitchenStatus;
    } catch {}
    return INITIAL_STATUS;
  }

  get status(): KitchenStatus  { return this._status(); }
  get isClosed(): boolean       { return !this._status().is_open; }
  get notifyLoading(): boolean  { return this._notifyLoading(); }
  get notifyDone(): boolean     { return this._notifyDone(); }

  /** Call once on app start. Silently falls back to cached/mock on error. */
  load(): Observable<KitchenStatus> {
    if (environment.useMock) {
      return of(MOCK_STATUS);
    }
    this._loading.set(true);
    return this.api.get<KitchenStatus>('/kitchen/status').pipe(
      tap(s => {
        this._status.set(s);
        this._loading.set(false);
        // Persist so next page load renders correct banner state immediately
        try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(s)); } catch {}
      }),
      catchError(() => {
        this._loading.set(false);
        return of(this._status());
      }),
    );
  }

  /** Notify user when kitchen opens. */
  notifyMe(mobile: string, userId: string | null): Observable<{ success: boolean }> {
    this._notifyLoading.set(true);
    if (environment.useMock) {
      this._notifyLoading.set(false);
      this._notifyDone.set(true);
      return of({ success: true });
    }
    return this.api.post<{ success: boolean }>('/kitchen/notify-me', {
      mobile,
      user_id: userId,
    }).pipe(
      tap(() => {
        this._notifyLoading.set(false);
        this._notifyDone.set(true);
      }),
      catchError(() => {
        this._notifyLoading.set(false);
        return of({ success: false });
      }),
    );
  }

  /** Programmatically mark kitchen as closed (e.g. from 403 error interceptor). */
  markClosed(message?: string): void {
    this._status.set({
      ...this._status(),
      is_open: false,
      closed_message: message ?? this._status().closed_message ?? 'We are currently closed.',
    });
  }
}
