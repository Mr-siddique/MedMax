import { requireMinItemTotal } from '../helpers';
import { CouponRule } from '../types';

export const first100: CouponRule = {
  code: 'FIRST100',
  title: '₹100 off your first order',
  description: '₹100 off on orders of ₹200 or more. One-time use',
  oneTimeUse: true,
  check: ctx => requireMinItemTotal(ctx, 200),
  effect: () => ({ discount: 100, waiveDelivery: false }),
};
