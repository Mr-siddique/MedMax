import { getMedicine } from '../data/medicineCatalog';
import { computeBill } from '../domain/bill';
import { resolveLines } from '../domain/cart';
import { CartLine } from '../domain/types';
import { isRecord, isStringArray } from '../utils/guards';

export const CART_STORAGE_VERSION = 1;
export const CART_STORAGE_KEY = 'medmax.cart';

export interface PersistedCart {
  lines: readonly CartLine[];
  couponCode: string | null;
  usedCouponCodes: readonly string[];
}

export const EMPTY_CART: PersistedCart = {
  lines: [],
  couponCode: null,
  usedCouponCodes: [],
};

function sanitizeLines(raw: unknown): CartLine[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  const seen = new Set<string>();
  const lines: CartLine[] = [];
  for (const entry of raw) {
    if (
      !isRecord(entry) ||
      typeof entry.id !== 'string' ||
      typeof entry.qty !== 'number' ||
      !Number.isInteger(entry.qty) ||
      entry.qty < 1 ||
      seen.has(entry.id)
    ) {
      continue;
    }
    const medicine = getMedicine(entry.id);
    if (!medicine) {
      continue;
    }
    seen.add(entry.id);
    lines.push({ id: entry.id, qty: Math.min(entry.qty, medicine.maxQty) });
  }
  return lines;
}

/**
 * Turns whatever was on disk into a valid cart: unknown items dropped, quantities
 * clamped to 1..maxQty, and a coupon that no longer qualifies silently cleared.
 * Never throws.
 */
export function sanitizeCart(raw: unknown): PersistedCart {
  if (!isRecord(raw)) {
    return EMPTY_CART;
  }
  const lines = sanitizeLines(raw.lines);
  const usedCouponCodes = isStringArray(raw.usedCouponCodes)
    ? [...new Set(raw.usedCouponCodes)]
    : [];
  const savedCoupon =
    typeof raw.couponCode === 'string' ? raw.couponCode : null;

  const bill = computeBill(
    resolveLines(lines, getMedicine),
    savedCoupon,
    usedCouponCodes,
  );
  return {
    lines,
    couponCode: bill.appliedCouponCode,
    usedCouponCodes,
  };
}
