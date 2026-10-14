import { CouponRule } from '../types';

const PERCENT = 10;
const MAX_DISCOUNT = 100;

export const save10: CouponRule = {
  code: 'SAVE10',
  title: '10% off',
  description: '10% off your cart, up to ₹100',
  check: () => ({ eligible: true }),
  effect: ctx => ({
    discount: Math.min(
      Math.floor((ctx.itemTotal * PERCENT) / 100),
      MAX_DISCOUNT,
    ),
    waiveDelivery: false,
  }),
};
