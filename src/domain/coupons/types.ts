export interface CouponContext {
  /** Sum of line totals before any discount or delivery fee. */
  itemTotal: number;
}

export type Eligibility =
  | { eligible: true }
  | { eligible: false; reason: string };

export interface CouponEffect {
  /** Whole rupees off the item total. The bill clamps it to the item total. */
  discount: number;
  waiveDelivery: boolean;
}

/**
 * A coupon is one rule object. Adding a coupon means adding a rule and listing
 * it in the registry (coupons/index.ts); cart and bill code never change.
 */
export interface CouponRule {
  code: string;
  title: string;
  description: string;
  /** The engine rejects a used code and the cart records it on order placement. */
  oneTimeUse?: boolean;
  check(ctx: CouponContext): Eligibility;
  /** Only called after `check` passed. */
  effect(ctx: CouponContext): CouponEffect;
}
