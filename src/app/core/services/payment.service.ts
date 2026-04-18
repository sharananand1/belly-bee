import { Injectable, inject } from '@angular/core';
import { Observable, of, from } from 'rxjs';
import { delay } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiService } from '../api.service';

declare var Razorpay: any;

export interface RazorpayOrder {
  id: string;       // Razorpay order id
  amount: number;   // in paise
  currency: string;
  key: string;      // Razorpay key_id from backend
}

export interface PaymentResult {
  success: boolean;
  payment_id?: string;
  razorpay_order_id?: string;
  signature?: string;
  error?: string;
}

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private api = inject(ApiService);

  /** Create a Razorpay order on the backend. Returns orderId + amount. */
  createRazorpayOrder(amountRupees: number, orderNumber: string): Observable<RazorpayOrder> {
    if (environment.useMock) {
      return of({
        id: 'mock_rpay_' + Date.now(),
        amount: amountRupees * 100,
        currency: 'INR',
        key: environment.razorpayKey,
      }).pipe(delay(600));
    }
    return this.api.post<RazorpayOrder>('/payment/create-order', {
      amount: amountRupees * 100,
      order_number: orderNumber,
    });
  }

  /** Open Razorpay checkout UI. Resolves with payment_id, signature, orderId on success. */
  openRazorpayCheckout(
    rpayOrderId: string,
    amountPaise: number,
    userName: string,
    userPhone: string,
    description: string,
    key?: string
  ): Promise<PaymentResult> {
    if (environment.useMock) {
      return new Promise(resolve =>
        setTimeout(() => resolve({
          success: true,
          payment_id: 'mock_pay_' + Date.now(),
          razorpay_order_id: rpayOrderId,
          signature: 'mock_sig',
        }), 1500)
      );
    }

    return new Promise(resolve => {
      const options = {
        key: key ?? environment.razorpayKey,
        amount: amountPaise,
        currency: 'INR',
        name: 'Belly Bee',
        description,
        order_id: rpayOrderId,
        prefill: { name: userName, contact: userPhone },
        theme: { color: '#F5A623' },
        handler: (response: any) => {
          resolve({
            success: true,
            payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            signature: response.razorpay_signature,
          });
        },
        modal: {
          ondismiss: () => resolve({ success: false, error: 'Payment cancelled' }),
        },
      };

      const rzp = new Razorpay(options);
      rzp.on('payment.failed', (resp: any) => {
        resolve({ success: false, error: resp.error?.description ?? 'Payment failed' });
      });
      rzp.open();
    });
  }

  /** Verify payment signature on backend after successful Razorpay flow. */
  verifyPayment(paymentId: string, orderId: string, signature: string): Observable<{ verified: boolean }> {
    if (environment.useMock) {
      return of({ verified: true }).pipe(delay(400));
    }
    return this.api.post<{ verified: boolean }>('/payment/verify', { paymentId, orderId, signature });
  }
}
