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
import { PaymentMethod } from '../../../models/order.model';

@Component({
  selector: 'app-checkout-payment',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './checkout-payment.component.html',
  styleUrl:    './checkout-payment.component.css',
})
export class CheckoutPaymentComponent implements OnInit {
  private cart      = inject(CartService);
  private orderSvc  = inject(OrderService);
  private paymentSvc= inject(PaymentService);
  private checkout  = inject(CheckoutStateService);
  private authSvc   = inject(AuthService);
  private toast     = inject(ToastService);
  private analytics = inject(AnalyticsService);
  private router    = inject(Router);

  paymentMethod = signal<PaymentMethod>('razorpay');
  placing       = signal(false);

  get state()    { return this.checkout.state; }
  get subtotal() { return this.state.subtotal ?? this.cart.subtotal; }
  get couponDiscount() { return this.state.coupon_result?.discount_amount ?? 0; }
  get deliveryFee()    { return this.state.delivery_fee ?? 40; }
  get gst()            { return this.state.gst ?? 0; }
  get total()          { return this.state.total ?? (this.subtotal + this.deliveryFee + this.gst); }
  get address()        { return this.state.delivery_address ?? null; }
  get cartItems()      { return this.cart.items; }

  ngOnInit(): void {
    // Guard: must have address + items
    if (!this.address || this.cart.isEmpty) {
      this.router.navigate([this.cart.isEmpty ? '/cart' : '/checkout/address']);
    }
  }

  selectMethod(m: PaymentMethod): void {
    this.paymentMethod.set(m);
  }

  async placeOrder(): Promise<void> {
    if (this.placing()) return;
    this.placing.set(true);

    const method = this.paymentMethod();
    let paymentId: string | undefined;

    try {
      // Razorpay flow
      if (method === 'razorpay') {
        const rpOrder = await firstValueFrom(
          this.paymentSvc.createRazorpayOrder(this.total, 'BB-' + Date.now())
        );

        const user = this.authSvc.getCachedUser();
        const result = await this.paymentSvc.openRazorpayCheckout(
          rpOrder!.id,
          rpOrder!.amount,
          user?.name ?? 'Guest',
          user?.mobile ?? '',
          'Belly Bee order — ₹' + this.total
        );

        if (!result.success) {
          this.toast.error(result.error ?? 'Payment cancelled.');
          this.placing.set(false);
          return;
        }
        paymentId = result.payment_id;
      }

      // Place order
      this.orderSvc.placeOrder({
        items: this.cartItems,
        delivery_address: this.address!,
        payment_method: method,
        payment_id: paymentId,
        coupon_code: this.state.coupon_result?.coupon?.code,
        coupon_discount: this.couponDiscount,
        subtotal: this.subtotal,
        delivery_fee: this.deliveryFee,
        gst: this.gst,
        total: this.total,
      }).subscribe({
        next: order => {
          this.cart.clear();
          this.checkout.clear();
          this.analytics.orderPlaced(order.order_id, order.total, method);
          this.router.navigate(['/order', order.order_id]);
        },
        error: () => {
          this.toast.error('Order failed. Please try again.');
          this.placing.set(false);
        },
      });

    } catch {
      this.toast.error('Something went wrong. Please try again.');
      this.placing.set(false);
    }
  }

  goBack(): void {
    this.router.navigate(['/checkout/address']);
  }
}
