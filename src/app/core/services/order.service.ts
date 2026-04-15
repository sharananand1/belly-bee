import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiService } from '../api.service';
import { MockDataService } from '../mock/mock-data.service';
import { Order, OrderTrackingInfo, OrderStatus, TrackingStep, ORDER_STATUS_LABELS } from '../../models/order.model';
import { CartItem } from '../../models/cart.model';
import { Address } from '../../models/address.model';
import { PaymentMethod } from '../../models/order.model';

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
  private api = inject(ApiService);
  private mock = inject(MockDataService);

  placeOrder(payload: PlaceOrderPayload): Observable<Order> {
    if (environment.useMock) {
      const order = this.mock.saveOrder(payload);
      return of(order).pipe(delay(1200));
    }
    return this.api.post<Order>('/orders', payload);
  }

  getOrders(): Observable<Order[]> {
    if (environment.useMock) {
      return of(this.mock.getOrders()).pipe(delay(400));
    }
    return this.api.get<Order[]>('/orders');
  }

  getOrderById(orderId: string): Observable<Order | null> {
    if (environment.useMock) {
      return of(this.mock.getOrderById(orderId)).pipe(delay(300));
    }
    return this.api.get<Order>(`/orders/${orderId}`);
  }

  getTrackingInfo(orderId: string): Observable<OrderTrackingInfo | null> {
    if (environment.useMock) {
      const order = this.mock.getOrderById(orderId);
      if (!order) return of(null);
      return of(this._buildTracking(order)).pipe(delay(300));
    }
    return this.api.get<OrderTrackingInfo>(`/orders/${orderId}/tracking`);
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
