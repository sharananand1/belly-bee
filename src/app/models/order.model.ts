import { Address } from './address.model';
import { SpicyLevel, ServeOption, SizeOption } from './menu-item.model';

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

export type PaymentMethod = 'razorpay' | 'cod' | 'upi';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface OrderItem {
  menu_item_id: string;
  name: string;
  image_url: string;
  quantity: number;
  unit_price: number;
  selected_spicy_level?: SpicyLevel;
  selected_serve?: ServeOption;
  selected_size?: SizeOption;
  special_instructions?: string;
  line_total: number;
}

export interface Order {
  order_id: string;
  order_number: string;
  user_id: string;
  items: OrderItem[];
  status: OrderStatus;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  payment_id?: string;
  delivery_address: Address;
  subtotal: number;
  discount: number;
  coupon_code?: string;
  coupon_discount: number;
  delivery_fee: number;
  gst: number;
  total: number;
  placed_at: string;
  estimated_delivery: string;
  source: 'web' | 'app';
}

export interface OrderTrackingInfo {
  order_id: string;
  order_number: string;
  status: OrderStatus;
  estimated_delivery: string;
  steps: TrackingStep[];
}

export interface TrackingStep {
  status: OrderStatus;
  label: string;
  timestamp?: string;
  completed: boolean;
  active: boolean;
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Order Placed',
  confirmed: 'Confirmed',
  preparing: 'Being Prepared',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  pending: '#F39C12',
  confirmed: '#2980B9',
  preparing: '#F5A623',
  out_for_delivery: '#8E44AD',
  delivered: '#27AE60',
  cancelled: '#E84444',
};
