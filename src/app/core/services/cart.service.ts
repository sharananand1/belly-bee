import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { CartItem, CartOptions } from '../../models/cart.model';
import { MenuItem, AnyVariant, resolvePrice } from '../../models/menu-item.model';
import { AppConfigService } from './app-config.service';

const CART_KEY = 'bb_cart';

@Injectable({ providedIn: 'root' })
export class CartService {
  private _items$ = new BehaviorSubject<CartItem[]>(this._loadFromStorage());
  private configSvc = inject(AppConfigService);

  readonly items$ = this._items$.asObservable();

  get items(): CartItem[] {
    return this._items$.value;
  }

  get count(): number {
    return this.items.reduce((acc, i) => acc + i.quantity, 0);
  }

  get subtotal(): number {
    return this.items.reduce((acc, i) => acc + i.item_total, 0);
  }

  get isEmpty(): boolean {
    return this.items.length === 0;
  }

  // ── Config-based validation ───────────────────────────────────────────

  /** Returns an error message if cart exceeds config limits, otherwise null. */
  validate(): string | null {
    const cfg = this.configSvc.config;
    if (this.items.length > cfg.max_cart_items) {
      return `Cart can hold at most ${cfg.max_cart_items} items.`;
    }
    if (this.subtotal > cfg.max_order_value) {
      return `Maximum order value is ₹${cfg.max_order_value}.`;
    }
    return null;
  }

  get isOverMaxItems(): boolean {
    return this.items.length > this.configSvc.config.max_cart_items;
  }

  get isOverMaxValue(): boolean {
    return this.subtotal > this.configSvc.config.max_order_value;
  }

  // ── Mutations ────────────────────────────────────────────────────────

  addItem(item: MenuItem, opts: CartOptions = {}): void {
    const variant: AnyVariant | undefined = opts.serve ?? opts.size;
    const unitPrice = resolvePrice(item, variant);
    const qty = opts.quantity ?? 1;

    const existing = this.items.findIndex(
      c =>
        c.menu_item.id === item.id &&
        c.selected_serve === opts.serve &&
        c.selected_size === opts.size &&
        c.selected_spicy_level === opts.spicy_level
    );

    if (existing >= 0) {
      const updated = this.items.map((c, i) => {
        if (i !== existing) return c;
        const newQty = c.quantity + qty;
        return { ...c, quantity: newQty, item_total: unitPrice * newQty };
      });
      this._publish(updated);
    } else {
      const cartItem: CartItem = {
        menu_item: item,
        quantity: qty,
        selected_spicy_level: opts.spicy_level,
        selected_serve: opts.serve,
        selected_size: opts.size,
        special_instructions: opts.special_instructions,
        item_total: unitPrice * qty,
      };
      this._publish([...this.items, cartItem]);
    }
  }

  removeItem(index: number): void {
    this._publish(this.items.filter((_, i) => i !== index));
  }

  updateQuantity(index: number, qty: number): void {
    if (qty <= 0) {
      this.removeItem(index);
      return;
    }
    const updated = this.items.map((c, i) => {
      if (i !== index) return c;
      const variant: AnyVariant | undefined = c.selected_serve ?? c.selected_size;
      const unitPrice = resolvePrice(c.menu_item, variant);
      return { ...c, quantity: qty, item_total: unitPrice * qty };
    });
    this._publish(updated);
  }

  clear(): void {
    this._publish([]);
  }

  private _publish(items: CartItem[]): void {
    this._items$.next(items);
    this._saveToStorage(items);
  }

  private _saveToStorage(items: CartItem[]): void {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(items));
    } catch {
      // storage full — fail silently
    }
  }

  private _loadFromStorage(): CartItem[] {
    try {
      const raw = localStorage.getItem(CART_KEY);
      return raw ? (JSON.parse(raw) as CartItem[]) : [];
    } catch {
      return [];
    }
  }
}
