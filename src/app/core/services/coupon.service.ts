import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiService } from '../api.service';
import { MockDataService } from '../mock/mock-data.service';
import { CouponCode, CouponResult } from '../../models/coupon.model';

@Injectable({ providedIn: 'root' })
export class CouponService {
  private api  = inject(ApiService);
  private mock = inject(MockDataService);

  getCoupons(): Observable<CouponCode[]> {
    if (environment.useMock) return this.mock.getCoupons();
    return this.api.get<CouponCode[]>('/coupons');
  }

  applyCoupon(code: string, cartTotal: number): Observable<CouponResult> {
    if (environment.useMock) return this.mock.applyCoupon(code, cartTotal);
    return this.api.post<CouponResult>('/coupons/apply', { code, cart_total: cartTotal });
  }
}
