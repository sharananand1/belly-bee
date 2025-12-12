import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

// ---------- minimal API shapes ----------
export interface CartItemDTO {
  id: string;
  itemId: string;
  variantId?: string | null;
  quantity: number;
  priceAtAdd: number;         // paise or rupees per your backend
  item?: { id: string; name: string; imageUrl?: string };
}

export interface CartDTO {
  id: string;
  userId: string;
  items: CartItemDTO[];
  total: number;
  discount: number;
}

export interface TotalsDTO {
  subtotal: number;
  discount: number;
  total: number;
  currency: string;
  tax?: number;
  deliveryFee?: number;
}

@Injectable({ providedIn: 'root' })
export class Api {
  private base = environment.apiBase;
  constructor(private http: HttpClient) {}

  // ---------- Auth ----------
  requestOtp(phone: string) {
    return this.http.post<{ ok: boolean; devCode?: string }>(
      `${this.base}/auth/otp/request`,
      { phone }
    );
  }

  verifyOtp(phone: string, code: string) {
    return this.http.post<{ access: string; refresh: string; user: any }>(
      `${this.base}/auth/otp/verify`,
      { phone, code }
    );
  }

  // ---------- Catalog ----------
  listCategories() {
    return this.http.get<any[]>(`${this.base}/catalog/categories`);
  }

  listItemsByCategory(slug: string) {
    return this.http.get<any[]>(`${this.base}/catalog/categories/${slug}/items`);
  }

  listAllItems() {
    return this.http.get<any[]>(`${this.base}/catalog/items`);
  }

  // ---------- Addresses ----------
  getAddresses() {
    return this.http.get<any[]>(`${this.base}/addresses`);
  }

  // create or update address
  saveAddress(addr: {
    id?: string;
    label: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
    landmark?: string;
    lat?: number;
    lng?: number;
    isDefault?: boolean;
  }) {
    return addr.id
      ? this.http.put(`${this.base}/addresses/${addr.id}`, addr)
      : this.http.post(`${this.base}/addresses`, addr);
  }

  // ---------- Cart (server-authoritative) ----------
  getCart() {
    return this.http.get<CartDTO>(`${this.base}/cart`);
  }

  addToCart(itemId: string, variantId?: string, qty = 1) {
    return this.http.post<CartDTO>(`${this.base}/cart/add`, { itemId, variantId, qty });
  }

  // set exact quantity for a cart line
  setCartQty(cartItemId: string, qty: number) {
    return this.http.post<CartDTO>(`${this.base}/cart/set`, { cartItemId, qty });
  }

  // remove a cart line
  removeCartItem(cartItemId: string) {
    return this.http.post<CartDTO>(`${this.base}/cart/remove`, { cartItemId });
  }

  totals() {
    return this.http.get<TotalsDTO>(`${this.base}/cart/totals`);
  }

  // ---------- Payments ----------
  createRzpOrder() {
    return this.http.post<{
      rzpOrderId: string;
      amount: number;
      currency: string;
      orderId: string;
      keyId: string;
    }>(`${this.base}/payments/create-order`, {});
  }
}
