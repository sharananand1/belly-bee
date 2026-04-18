import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export type AnalyticsEventType =
  | 'page_view'
  | 'menu_item_viewed'
  | 'cart_add'
  | 'cart_remove'
  | 'checkout_started'
  | 'checkout_error'
  | 'order_placed'
  | 'payment_started'
  | 'payment_failed';

export type CheckoutErrorCode =
  | 'kitchen_closed'
  | 'below_min'
  | 'too_far'
  | 'stock_out'
  | 'fraud_limit';

const SESSION_KEY = 'bb_session_id';

function getSessionId(): string {
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = Math.random().toString(36).slice(2) + Date.now().toString(36);
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

function getCachedUserId(): string | null {
  try {
    const raw = localStorage.getItem('bb_user');
    return raw ? JSON.parse(raw)?.id ?? null : null;
  } catch { return null; }
}

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private http = inject(HttpClient);

  /**
   * Fire-and-forget analytics event to POST /events.
   * In mock/dev mode, logs to console only — no network call.
   */
  trackEvent(type: AnalyticsEventType, meta: Record<string, any> = {}): void {
    const payload = {
      type,
      user_id: getCachedUserId(),
      session_id: getSessionId(),
      meta,
    };

    if (environment.useMock || !environment.production) {
      console.debug('[Analytics]', type, payload);
      return;
    }

    // POST /events — fire and forget (no auth needed per spec)
    this.http.post(`${environment.apiUrl}/events`, payload).subscribe({
      error: () => { /* silently swallow — analytics must never break the app */ },
    });
  }

  // ── Convenience helpers ────────────────────────────────────────────────

  pageView(page: string): void {
    this.trackEvent('page_view', { page });
  }

  menuItemViewed(itemId: string, itemName: string): void {
    this.trackEvent('menu_item_viewed', { item_id: itemId, item_name: itemName });
  }

  cartAdd(itemId: string, itemName: string, price: number, quantity: number): void {
    this.trackEvent('cart_add', { item_id: itemId, item_name: itemName, price, quantity });
  }

  cartRemove(itemId: string, itemName: string): void {
    this.trackEvent('cart_remove', { item_id: itemId, item_name: itemName });
  }

  checkoutStarted(cartValue: number): void {
    this.trackEvent('checkout_started', { cart_value: cartValue });
  }

  checkoutError(errorCode: CheckoutErrorCode, cartValue: number, errorMessage?: string): void {
    this.trackEvent('checkout_error', { error_code: errorCode, cart_value: cartValue, error_message: errorMessage });
  }

  orderPlaced(orderId: string, total: number, paymentMethod: string): void {
    this.trackEvent('order_placed', { order_id: orderId, total, payment_method: paymentMethod });
  }

  paymentStarted(total: number, method: string): void {
    this.trackEvent('payment_started', { total, method });
  }

  paymentFailed(total: number, method: string, reason?: string): void {
    this.trackEvent('payment_failed', { total, method, reason });
  }
}
