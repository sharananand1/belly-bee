import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiService } from '../api.service';
import { MockDataService } from '../mock/mock-data.service';
import { CouponCode, CouponResult } from '../../models/coupon.model';

@Injectable({ providedIn: 'root' })
export class CouponService {
  private api = inject(ApiService);
  private mock = inject(MockDataService);

  getCoupons(): Observable<CouponCode[]> {
    if (environment.useMock) {
      return of(this.mock.getCoupons()).pipe(delay(200));
    }
    return this.api.get<CouponCode[]>('/coupons');
  }

  applyCoupon(code: string, cartTotal: number): Observable<CouponResult> {
    if (environment.useMock) {
      return of(this.mock.applyCoupon(code, cartTotal)).pipe(delay(500));
    }
    return this.api.post<CouponResult>('/coupons/apply', { code, cart_total: cartTotal });
  }
}
