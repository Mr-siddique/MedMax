import { formatRupees } from '../../utils/money';
import { CouponContext, Eligibility } from './types';

export function requireMinItemTotal(
  ctx: CouponContext,
  min: number,
): Eligibility {
  if (ctx.itemTotal >= min) {
    return { eligible: true };
  }
  return {
    eligible: false,
    reason: `Add ${formatRupees(
      min - ctx.itemTotal,
    )} more to use this coupon (minimum ${formatRupees(min)})`,
  };
}
