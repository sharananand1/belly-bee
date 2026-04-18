import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiService } from '../api.service';
import { MockDataService } from '../mock/mock-data.service';
import { CouponCode, CouponResult } from '../../models/coupon.model';

/** Backend returns discount_value / min_order_value as strings → coerce to number. */
function normaliseCoupon(raw: any): CouponCode {
  return {
    ...raw,
    discount_value: +raw.discount_value,
    min_order_value: +raw.min_order_value,
    max_discount: raw.max_discount != null ? +raw.max_discount : undefined,
  } as CouponCode;
}

@Injectable({ providedIn: 'root' })
export class CouponService {
  private api  = inject(ApiService);
  private mock = inject(MockDataService);

  getCoupons(): Observable<CouponCode[]> {
    if (environment.useMock) return this.mock.getCoupons();
    return this.api.get<CouponCode[]>('/coupons')
      .pipe(map(coupons => coupons.map(normaliseCoupon)));
  }

  applyCoupon(code: string, cartTotal: number): Observable<CouponResult> {
    if (environment.useMock) return this.mock.applyCoupon(code, cartTotal);
    return this.api.post<CouponResult>('/coupons/apply', { code, cart_total: cartTotal }).pipe(
      map(result => ({
        ...result,
        discount_amount: +result.discount_amount,
        coupon: result.coupon ? normaliseCoupon(result.coupon) : undefined,
      }))
    );
  }
}
