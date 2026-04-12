export interface CouponCode {
  code: string;
  discount_type: 'percent' | 'flat';
  discount_value: number;
  min_order_value: number;
  max_discount?: number;
  valid_till: string;
  is_active: boolean;
  description: string;
}

export interface CouponResult {
  valid: boolean;
  coupon?: CouponCode;
  discount_amount: number;
  message: string;
}
