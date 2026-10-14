import { CouponRule } from '../types';

export const freedel: CouponRule = {
  code: 'FREEDEL',
  title: 'Free delivery',
  description: 'Delivery fee waived on any order',
  check: () => ({ eligible: true }),
  effect: () => ({ discount: 0, waiveDelivery: true }),
};
