import { Injectable, inject, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { ApiService } from '../api.service';
import { environment } from '../../../environments/environment';

export interface AppConfig {
  kitchen_open: boolean;
  cod_enabled: boolean;
  razorpay_enabled: boolean;
  upi_enabled: boolean;
  cod_extra_charge: number;
  delivery_fee: number;
  free_delivery_threshold: number;
  gst_percent: number;
  min_order_value: number;
  max_order_value: number;
  max_cart_items: number;
  max_delivery_km: number;
  estimated_delivery_minutes: number;
  zomato_url: string;
}

/** Safe defaults used in mock mode and as fallback if /config fails. */
const DEFAULT_CONFIG: AppConfig = {
  kitchen_open: true,
  cod_enabled: true,
  razorpay_enabled: true,
  upi_enabled: false,
  cod_extra_charge: 20,
  delivery_fee: 40,
  free_delivery_threshold: 300,
  gst_percent: 5,
  min_order_value: 100,
  max_order_value: 5000,
  max_cart_items: 20,
  max_delivery_km: 10,
  estimated_delivery_minutes: 40,
  zomato_url: 'https://zomato.com/belly-bee',
};

@Injectable({ providedIn: 'root' })
export class AppConfigService {
  private api = inject(ApiService);
  private _config = signal<AppConfig>(DEFAULT_CONFIG);

  /** Live config snapshot. Always returns a valid config (never null). */
  get config(): AppConfig { return this._config(); }

  /** Call once on app start. Safe to ignore errors — falls back to defaults. */
  load(): Observable<AppConfig> {
    if (environment.useMock) {
      return of(DEFAULT_CONFIG);
    }
    return this.api.get<AppConfig>('/config').pipe(
      tap(cfg => this._config.set(cfg)),
      catchError(() => of(this._config())),
    );
  }
}
