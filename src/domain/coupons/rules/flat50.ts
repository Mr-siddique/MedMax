import { requireMinItemTotal } from '../helpers';
import { CouponRule } from '../types';

export const flat50: CouponRule = {
  code: 'FLAT50',
  title: '₹50 off',
  description: 'Flat ₹50 off on orders of ₹300 or more',
  check: ctx => requireMinItemTotal(ctx, 300),
  effect: () => ({ discount: 50, waiveDelivery: false }),
};
