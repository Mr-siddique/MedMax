import { useMemo } from 'react';
import { getMedicine } from '../data/medicineCatalog';
import { Bill } from '../domain/bill';
import { resolveLines } from '../domain/cart';
import { ResolvedLine } from '../domain/types';
import { billOf, useCartStore } from './cartStore';

/** The cart joined with catalog data, plus its bill. Recomputed only when the cart changes. */
export function useCart(): { lines: ResolvedLine[]; bill: Bill } {
  const lines = useCartStore(state => state.lines);
  const couponCode = useCartStore(state => state.couponCode);
  const usedCouponCodes = useCartStore(state => state.usedCouponCodes);

  return useMemo(
    () => ({
      lines: resolveLines(lines, getMedicine),
      bill: billOf({ lines, couponCode, usedCouponCodes }),
    }),
    [lines, couponCode, usedCouponCodes],
  );
}
