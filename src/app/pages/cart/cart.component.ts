import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { CartService } from '../../core/services/cart.service';
import { CouponService } from '../../core/services/coupon.service';
import { ToastService } from '../../core/services/toast.service';
import { AnalyticsService } from '../../core/services/analytics.service';
import { VegBadgeComponent } from '../../shared/components/veg-badge/veg-badge.component';
import { CartItem } from '../../models/cart.model';
import { CouponResult } from '../../models/coupon.model';
import { AuthService } from '../../core/services/auth.service';

const DELIVERY_FEE       = 40;
const FREE_DELIVERY_MIN  = 499;
const GST_RATE           = 0.05;

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, VegBadgeComponent],
  templateUrl: './cart.component.html',
  styleUrl:    './cart.component.css',
})
export class CartComponent {
  private cart      = inject(CartService);
  private couponSvc = inject(CouponService);
  private toast     = inject(ToastService);
  private analytics = inject(AnalyticsService);
  private router    = inject(Router);
  private authSvc   = inject(AuthService);

  // ── Reactive cart items via toSignal ──────────────────────────
  items = toSignal(this.cart.items$, { initialValue: [] as typeof this.cart.items });

  // ── Coupon state ──────────────────────────────────────────────
  couponInput    = signal('');
  appliedCoupon  = signal<CouponResult | null>(null);
  couponLoading  = signal(false);

  // ── Derived pricing ───────────────────────────────────────────
  subtotal = computed(() => this.items().reduce((s, i) => s + i.item_total, 0));

  couponDiscount = computed(() => this.appliedCoupon()?.discount_amount ?? 0);

  deliveryFee = computed(() =>
    this.subtotal() - this.couponDiscount() >= FREE_DELIVERY_MIN ? 0 : DELIVERY_FEE
  );

  gst = computed(() => Math.round((this.subtotal() - this.couponDiscount()) * GST_RATE));

  total = computed(() =>
    this.subtotal() - this.couponDiscount() + this.deliveryFee() + this.gst()
  );

  get isEmpty(): boolean { return this.items().length === 0; }

  get freeDeliveryGap(): number {
    return Math.max(0, FREE_DELIVERY_MIN - this.subtotal() + this.couponDiscount());
  }

  // ── Quantity controls ─────────────────────────────────────────
  increment(index: number): void {
    this.cart.updateQuantity(index, this.items()[index].quantity + 1);
  }

  decrement(index: number): void {
    const qty = this.items()[index].quantity - 1;
    if (qty <= 0) this.cart.removeItem(index);
    else this.cart.updateQuantity(index, qty);
  }

  remove(index: number): void {
    this.cart.removeItem(index);
    this.toast.info('Item removed from cart');
  }

  // ── Coupon ────────────────────────────────────────────────────
  applyCoupon(): void {
    const code = this.couponInput().trim().toUpperCase();
    if (!code) return;
    this.couponLoading.set(true);
    this.couponSvc.applyCoupon(code, this.subtotal()).subscribe({
      next: result => {
        this.appliedCoupon.set(result);
        if (result.valid) {
          this.toast.success(result.message);
          this.analytics.trackEvent('checkout_started', { coupon: code, discount: result.discount_amount });
        } else {
          this.toast.error(result.message);
        }
        this.couponLoading.set(false);
      },
      error: () => {
        this.toast.error('Failed to apply coupon. Try again.');
        this.couponLoading.set(false);
      },
    });
  }

  removeCoupon(): void {
    this.appliedCoupon.set(null);
    this.couponInput.set('');
    this.toast.info('Coupon removed');
  }

  // ── Checkout ──────────────────────────────────────────────────
  checkout(): void {
    this.analytics.checkoutStarted(this.subtotal());
    if (this.authSvc.isLoggedIn()) {
      this.router.navigate(['/checkout/address']);
    } else {
      this.router.navigate(['/auth/login'], {
        queryParams: { returnUrl: '/checkout/address' },
      });
    }
  }

  // ── Helpers ───────────────────────────────────────────────────
  selectedOptions(item: CartItem): string {
    const parts: string[] = [];
    if (item.selected_serve)      parts.push(item.selected_serve === 'serve-1' ? 'Serve 1' : 'Serve 2');
    if (item.selected_size)       parts.push(item.selected_size);
    if (item.selected_spicy_level) parts.push(item.selected_spicy_level);
    return parts.join(' · ');
  }

  onImgError(img: HTMLImageElement): void { img.src = 'assets/bellyBeeLogo.webp'; }
}
