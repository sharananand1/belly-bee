import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiService } from '../api.service';
import { MockDataService } from '../mock/mock-data.service';
import {
  Order, OrderTrackingInfo, OrderStatus, TrackingStep,
  ORDER_STATUS_LABELS, PaymentMethod,
} from '../../models/order.model';
import { CartItem } from '../../models/cart.model';
import { Address } from '../../models/address.model';
import { AnyVariant, resolvePrice } from '../../models/menu-item.model';

export interface PlaceOrderPayload {
  items: CartItem[];
  delivery_address: Address;
  payment_method: PaymentMethod;
  payment_id?: string;
  coupon_code?: string;
  coupon_discount?: number;
  subtotal: number;
  delivery_fee: number;
  gst: number;
  total: number;
}

const ORDER_STATUSES: OrderStatus[] = [
  'pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered',
];

@Injectable({ providedIn: 'root' })
export class OrderService {
  private api  = inject(ApiService);
  private mock = inject(MockDataService);

  placeOrder(payload: PlaceOrderPayload): Observable<Order> {
    if (environment.useMock) {
      const order = this._buildOrder(payload);
      this.mock.saveOrder(order);
      return of(order);
    }
    return this.api.post<Order>('/orders', payload);
  }

  getOrders(): Observable<Order[]> {
    if (environment.useMock) return this.mock.getOrders();
    return this.api.get<Order[]>('/orders');
  }

  getOrderById(orderId: string): Observable<Order | undefined> {
    if (environment.useMock) return this.mock.getOrderById(orderId);
    return this.api.get<Order>(`/orders/${orderId}`);
  }

  getTrackingInfo(orderId: string): Observable<OrderTrackingInfo | null> {
    if (environment.useMock) {
      return this.mock.getOrderById(orderId).pipe(
        map(order => order ? this._buildTracking(order) : null)
      );
    }
    return this.api.get<OrderTrackingInfo>(`/orders/${orderId}/tracking`);
  }

  private _buildOrder(payload: PlaceOrderPayload): Order {
    const now = new Date();
    const est = new Date(now.getTime() + 40 * 60 * 1000);
    return {
      order_id: 'ord_' + Date.now(),
      order_number: 'BB-' + now.getFullYear() + '-' + String(Date.now()).slice(-5),
      user_id: 'mock_user',
      items: payload.items.map(ci => ({
        menu_item_id: ci.menu_item.id,
        name: ci.menu_item.name,
        image_url: ci.menu_item.image_url,
        quantity: ci.quantity,
        unit_price: resolvePrice(ci.menu_item, ci.selected_serve ?? ci.selected_size),
        selected_spicy_level: ci.selected_spicy_level,
        selected_serve: ci.selected_serve,
        selected_size: ci.selected_size,
        special_instructions: ci.special_instructions,
        line_total: ci.item_total,
      })),
      status: 'pending',
      payment_method: payload.payment_method,
      payment_status: payload.payment_method === 'cod' ? 'pending' : 'paid',
      payment_id: payload.payment_id,
      delivery_address: payload.delivery_address,
      subtotal: payload.subtotal,
      discount: 0,
      coupon_code: payload.coupon_code,
      coupon_discount: payload.coupon_discount ?? 0,
      delivery_fee: payload.delivery_fee,
      gst: payload.gst,
      total: payload.total,
      placed_at: now.toISOString(),
      estimated_delivery: est.toISOString(),
      source: 'web',
    };
  }

  private _buildTracking(order: Order): OrderTrackingInfo {
    const currentIdx = ORDER_STATUSES.indexOf(order.status);
    const steps: TrackingStep[] = ORDER_STATUSES.map((status, idx) => ({
      status,
      label: ORDER_STATUS_LABELS[status],
      timestamp: idx <= currentIdx ? order.placed_at : undefined,
      completed: idx < currentIdx,
      active: idx === currentIdx,
    }));
    return {
      order_id: order.order_id,
      order_number: order.order_number,
      status: order.status,
      estimated_delivery: order.estimated_delivery,
      steps,
    };
  }
}
