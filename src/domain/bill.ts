import { evaluateCoupon } from './coupons';
import { ResolvedLine } from './types';

export const DELIVERY_FEE = 40;
/** Orders strictly below this item total pay the delivery fee. */
export const FREE_DELIVERY_THRESHOLD = 499;

export interface Bill {
  itemTotal: number;
  discount: number;
  /** What the customer is actually charged (0 when free or waived). */
  deliveryFee: number;
  deliveryWaivedByCoupon: boolean;
  grandTotal: number;
  /** The coupon that is contributing to this bill, if any. */
  appliedCouponCode: string | null;
  /** Set when a coupon was supplied but no longer qualifies; it is ignored in the totals. */
  couponRejection: string | null;
  /** How much more to add for free delivery; 0 when already free or the cart is empty. */
  amountToFreeDelivery: number;
}

export function deliveryFeeFor(itemTotal: number): number {
  if (itemTotal <= 0 || itemTotal >= FREE_DELIVERY_THRESHOLD) {
    return 0;
  }
  return DELIVERY_FEE;
}

export function computeItemTotal(lines: readonly ResolvedLine[]): number {
  return lines.reduce((sum, line) => sum + line.medicine.price * line.qty, 0);
}

export function computeBill(
  lines: readonly ResolvedLine[],
  couponCode: string | null,
  usedCouponCodes: readonly string[],
): Bill {
  const itemTotal = computeItemTotal(lines);
  const standardFee = deliveryFeeFor(itemTotal);

  let discount = 0;
  let waiveDelivery = false;
  let appliedCouponCode: string | null = null;
  let couponRejection: string | null = null;

  if (couponCode !== null) {
    const evaluation = evaluateCoupon(couponCode, itemTotal, usedCouponCodes);
    if (evaluation.ok) {
      appliedCouponCode = couponCode;
      discount = Math.min(Math.max(evaluation.effect.discount, 0), itemTotal);
      waiveDelivery = evaluation.effect.waiveDelivery;
    } else {
      couponRejection = evaluation.reason;
    }
  }

  const deliveryFee = waiveDelivery ? 0 : standardFee;

  return {
    itemTotal,
    discount,
    deliveryFee,
    deliveryWaivedByCoupon: waiveDelivery && standardFee > 0,
    grandTotal: itemTotal - discount + deliveryFee,
    appliedCouponCode,
    couponRejection,
    amountToFreeDelivery:
      standardFee > 0 ? FREE_DELIVERY_THRESHOLD - itemTotal : 0,
  };
}
