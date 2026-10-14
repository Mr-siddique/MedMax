import { first100 } from './rules/first100';
import { flat50 } from './rules/flat50';
import { freedel } from './rules/freedel';
import { save10 } from './rules/save10';
import { CouponEffect, CouponRule, Eligibility } from './types';

export type { CouponEffect, CouponRule, Eligibility } from './types';

/** Display order on the Coupons screen. Register new rules here. */
const rules: readonly CouponRule[] = [flat50, save10, freedel, first100];

export type CouponEvaluation =
  | { ok: true; effect: CouponEffect }
  | { ok: false; reason: string };

export function getCouponRule(code: string): CouponRule | undefined {
  return rules.find(rule => rule.code === code);
}

export function isOneTimeUse(code: string): boolean {
  return getCouponRule(code)?.oneTimeUse === true;
}

function checkEligibility(
  rule: CouponRule,
  itemTotal: number,
  usedCodes: readonly string[],
): Eligibility {
  if (itemTotal <= 0) {
    return { eligible: false, reason: 'Your cart is empty' };
  }
  if (rule.oneTimeUse && usedCodes.includes(rule.code)) {
    return { eligible: false, reason: 'You have already used this coupon' };
  }
  return rule.check({ itemTotal });
}

export function evaluateCoupon(
  code: string,
  itemTotal: number,
  usedCodes: readonly string[],
): CouponEvaluation {
  const rule = getCouponRule(code);
  if (!rule) {
    return { ok: false, reason: 'This coupon is not valid' };
  }
  const eligibility = checkEligibility(rule, itemTotal, usedCodes);
  if (!eligibility.eligible) {
    return { ok: false, reason: eligibility.reason };
  }
  return { ok: true, effect: rule.effect({ itemTotal }) };
}

export interface CouponStatus {
  code: string;
  title: string;
  description: string;
  applied: boolean;
  eligibility: Eligibility;
}

export function listCouponStatuses(
  itemTotal: number,
  usedCodes: readonly string[],
  appliedCode: string | null,
): CouponStatus[] {
  return rules.map(rule => ({
    code: rule.code,
    title: rule.title,
    description: rule.description,
    applied: rule.code === appliedCode,
    eligibility: checkEligibility(rule, itemTotal, usedCodes),
  }));
}
