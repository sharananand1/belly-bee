import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

export type AnalyticsEvent =
  | 'page_view'
  | 'item_view'
  | 'add_to_cart'
  | 'remove_from_cart'
  | 'checkout_start'
  | 'checkout_address'
  | 'checkout_payment'
  | 'order_placed'
  | 'coupon_applied'
  | 'search'
  | 'login'
  | 'logout';

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  track(event: AnalyticsEvent, params: Record<string, any> = {}): void {
    if (environment.useMock || !environment.production) {
      // Log to console in dev/mock mode for debugging
      console.debug('[Analytics]', event, params);
      return;
    }
    // Production: send to backend analytics endpoint
    // Using navigator.sendBeacon so it doesn't block navigation
    const payload = JSON.stringify({ event, params, ts: Date.now() });
    if (navigator.sendBeacon) {
      navigator.sendBeacon(`${environment.apiUrl}/analytics/track`, payload);
    }
  }

  pageView(path: string, title?: string): void {
    this.track('page_view', { path, title: title ?? document.title });
  }

  itemView(itemId: string, itemName: string): void {
    this.track('item_view', { item_id: itemId, item_name: itemName });
  }

  addToCart(itemId: string, itemName: string, price: number, quantity: number): void {
    this.track('add_to_cart', { item_id: itemId, item_name: itemName, price, quantity });
  }

  orderPlaced(orderId: string, total: number, paymentMethod: string): void {
    this.track('order_placed', { order_id: orderId, total, payment_method: paymentMethod });
  }

  search(query: string, resultCount: number): void {
    this.track('search', { query, result_count: resultCount });
  }
}
