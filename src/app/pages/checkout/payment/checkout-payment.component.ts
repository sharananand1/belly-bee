import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { CartService } from '../../../core/services/cart.service';
import { OrderService } from '../../../core/services/order.service';
import { PaymentService } from '../../../core/services/payment.service';
import { CheckoutStateService } from '../../../core/services/checkout-state.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { AppConfigService } from '../../../core/services/app-config.service';
import { PaymentMethod } from '../../../models/order.model';

@Component({
  selector: 'app-checkout-payment',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './checkout-payment.component.html',
  styleUrl:    './checkout-payment.component.css',
})
export class CheckoutPaymentComponent implements OnInit {
  private cart       = inject(CartService);
  private orderSvc   = inject(OrderService);
  private paymentSvc = inject(PaymentService);
  private checkout   = inject(CheckoutStateService);
  private authSvc    = inject(AuthService);
  private toast      = inject(ToastService);
  private analytics  = inject(AnalyticsService);
  private configSvc  = inject(AppConfigService);
  private router     = inject(Router);

  paymentMethod = signal<PaymentMethod>('razorpay');
  placing       = signal(false);

  get config()         { return this.configSvc.config; }
  get state()          { return this.checkout.state; }
  get subtotal()       { return this.state.subtotal ?? this.cart.subtotal; }
  get couponDiscount() { return this.state.coupon_result?.discount_amount ?? 0; }
  get deliveryFee()    { return this.state.delivery_fee ?? this.config.delivery_fee; }
  get gst()            { return this.state.gst ?? 0; }
  get address()        { return this.state.delivery_address ?? null; }
  get cartItems()      { return this.cart.items; }

  /** COD extra charge — only applied when cod method selected. */
  get codCharge(): number {
    return this.paymentMethod() === 'cod' ? this.config.cod_extra_charge : 0;
  }

  /** Display total including COD charge if selected. */
  get displayTotal(): number {
    return (this.state.total ?? 0) + this.codCharge;
  }

  /** Available payment methods driven by config. */
  get availableMethods(): { id: PaymentMethod; label: string; icon: string }[] {
    const methods: { id: PaymentMethod; label: string; icon: string }[] = [];
    if (this.config.razorpay_enabled) {
      methods.push({ id: 'razorpay', label: 'Card / Net Banking / Wallet', icon: '💳' });
    }
    if (this.config.upi_enabled) {
      methods.push({ id: 'upi', label: 'UPI', icon: '📱' });
    }
    if (this.config.cod_enabled) {
      methods.push({ id: 'cod', label: 'Cash on Delivery', icon: '💵' });
    }
    return methods;
  }

  ngOnInit(): void {
    if (!this.address || this.cart.isEmpty) {
      this.router.navigate([this.cart.isEmpty ? '/cart' : '/checkout/address']);
      return;
    }
    // Default to first available method
    const first = this.availableMethods[0];
    if (first) this.paymentMethod.set(first.id);

    // Validate minimum order
    const afterCoupon = Math.max(0, this.subtotal - this.couponDiscount);
    if (afterCoupon < this.config.min_order_value) {
      this.toast.warning(
        `Minimum order is ₹${this.config.min_order_value}. Please add more items.`
      );
    }
  }

  selectMethod(m: PaymentMethod): void {
    this.paymentMethod.set(m);
  }

  async placeOrder(): Promise<void> {
    if (this.placing()) return;

    // Re-validate minimum order before placing
    const afterCoupon = Math.max(0, this.subtotal - this.couponDiscount);
    if (afterCoupon < this.config.min_order_value) {
      this.toast.warning(
        `Minimum order is ₹${this.config.min_order_value}. Add more items or try Zomato.`
      );
      this.analytics.checkoutError('below_min', this.displayTotal);
      return;
    }

    this.placing.set(true);
    const method = this.paymentMethod();
    let paymentId: string | undefined;
    let razorpayOrderId: string | undefined;
    let signature: string | undefined;

    try {
      // Razorpay flow
      if (method === 'razorpay' || method === 'upi') {
        const rpOrder = await firstValueFrom(
          this.paymentSvc.createRazorpayOrder(this.displayTotal, 'BB-' + Date.now())
        );

        const user = this.authSvc.getCachedUser();
        this.analytics.paymentStarted(this.displayTotal, method);

        const result = await this.paymentSvc.openRazorpayCheckout(
          rpOrder!.id,
          rpOrder!.amount,
          user?.name ?? 'Guest',
          user?.mobile ?? '',
          'Belly Bee order — ₹' + this.displayTotal,
          rpOrder!.key
        );

        if (!result.success) {
          this.analytics.paymentFailed(this.displayTotal, method, result.error);
          this.toast.error(result.error ?? 'Payment cancelled.');
          this.placing.set(false);
          return;
        }
        paymentId = result.payment_id;
        razorpayOrderId = result.razorpay_order_id;
        signature = result.signature;
      }

      // Place order
      this.orderSvc.placeOrder({
        items: this.cartItems,
        delivery_address: this.address!,
        payment_method: method,
        payment_id: paymentId,
        razorpay_order_id: razorpayOrderId,
        coupon_code: this.state.coupon_result?.coupon?.code,
        coupon_discount: this.couponDiscount,
        subtotal: this.subtotal,
        delivery_fee: this.deliveryFee,
        gst: this.gst,
        total: this.displayTotal,
      }).subscribe({
        next: order => {
          this.cart.clear();
          this.checkout.clear();
          this.analytics.orderPlaced(order.order_id, order.total, method);
          if (paymentId && razorpayOrderId && signature) {
            this.paymentSvc.verifyPayment(paymentId, razorpayOrderId, signature)
              .subscribe({ error: () => {} });
          }
          this.placing.set(false);
          this.router.navigate(['/order', order.order_id]);
        },
        error: err => {
          this.placing.set(false);
          this._handleOrderError(err);
        },
      });

    } catch {
      this.toast.error('Something went wrong. Please try again.');
      this.placing.set(false);
    }
  }

  private _handleOrderError(err: any): void {
    const msg: string = (err?.error?.message ?? '').toLowerCase();

    if (msg.includes('closed') || msg.includes('kitchen')) {
      this.analytics.checkoutError('kitchen_closed', this.displayTotal, err?.error?.message);
      this.toast.error('Kitchen is currently closed. Please try again later.');

    } else if (msg.includes('minimum') || msg.includes('min order')) {
      this.analytics.checkoutError('below_min', this.displayTotal, err?.error?.message);
      this.toast.warning(`Minimum order is ₹${this.config.min_order_value}.`);

    } else if (msg.includes('km') || msg.includes('distance') || msg.includes('deliver')) {
      this.analytics.checkoutError('too_far', this.displayTotal, err?.error?.message);
      this.toast.error('Sorry, we don\'t deliver to this location.');

    } else if (msg.includes('stock') || msg.includes('unavailable') || msg.includes('out of')) {
      this.analytics.checkoutError('stock_out', this.displayTotal, err?.error?.message);
      this.toast.error('Some items in your cart are now out of stock. Please review your cart.');

    } else if (msg.includes('hour') || msg.includes('limit') || msg.includes('many orders')) {
      this.analytics.checkoutError('fraud_limit', this.displayTotal, err?.error?.message);
      this.toast.warning('Too many orders recently. Please wait a while before trying again.');

    } else {
      this.toast.error('Order failed. Please try again.');
    }
  }

  goBack(): void {
    this.router.navigate(['/checkout/address']);
  }
}
