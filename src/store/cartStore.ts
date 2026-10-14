import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getMedicine } from '../data/medicineCatalog';
import { Bill, computeBill } from '../domain/bill';
import {
  addOne,
  removeLine,
  removeOne,
  resolveLines,
  totalQty,
} from '../domain/cart';
import { evaluateCoupon, isOneTimeUse } from '../domain/coupons';
import { CartLine } from '../domain/types';
import { persistOptions } from '../persistence/persistOptions';
import {
  CART_STORAGE_KEY,
  CART_STORAGE_VERSION,
  EMPTY_CART,
  PersistedCart,
  sanitizeCart,
} from './cartPersistence';
import { useToastStore } from './toastStore';

export interface Order {
  id: string;
  total: number;
  itemCount: number;
}

export type ApplyCouponResult = { ok: true } | { ok: false; reason: string };

interface CartState extends PersistedCart {
  /** Adds one unit (also used by the stepper's "+"). No-op at maxQty. */
  add: (id: string) => void;
  /** Removes one unit; the line disappears at zero. */
  decrement: (id: string) => void;
  remove: (id: string) => void;
  applyCoupon: (code: string) => ApplyCouponResult;
  removeCoupon: () => void;
  /** Mock checkout: clears the cart and records a one-time coupon as used. */
  placeOrder: () => Order | null;
}

export function billOf(cart: PersistedCart): Bill {
  return computeBill(
    resolveLines(cart.lines, getMedicine),
    cart.couponCode,
    cart.usedCouponCodes,
  );
}

export const useCartStore = create<CartState>()(
  persist<CartState, [], [], PersistedCart>(
    (set, get) => {
      /**
       * Applies a lines change and, if the applied coupon no longer qualifies,
       * clears it in the same update and tells the user why.
       */
      const setLines = (lines: readonly CartLine[]) => {
        const { couponCode, usedCouponCodes } = get();
        const { couponRejection } = billOf({
          lines,
          couponCode,
          usedCouponCodes,
        });
        if (couponCode !== null && couponRejection !== null) {
          useToastStore
            .getState()
            .show(`${couponCode} removed. ${couponRejection}`, 'warning');
          set({ lines, couponCode: null });
        } else {
          set({ lines });
        }
      };

      return {
        ...EMPTY_CART,

        add: id => {
          const medicine = getMedicine(id);
          if (!medicine) {
            return;
          }
          const { lines } = get();
          const next = addOne(lines, medicine);
          if (next !== lines) {
            setLines(next);
          }
        },

        decrement: id => setLines(removeOne(get().lines, id)),

        remove: id => setLines(removeLine(get().lines, id)),

        applyCoupon: code => {
          const { lines, usedCouponCodes } = get();
          const itemTotal = billOf({
            lines,
            couponCode: null,
            usedCouponCodes,
          }).itemTotal;
          const evaluation = evaluateCoupon(code, itemTotal, usedCouponCodes);
          if (!evaluation.ok) {
            return { ok: false, reason: evaluation.reason };
          }
          set({ couponCode: code });
          return { ok: true };
        },

        removeCoupon: () => set({ couponCode: null }),

        placeOrder: () => {
          const state = get();
          const bill = billOf(state);
          if (bill.itemTotal === 0) {
            return null;
          }
          const { usedCouponCodes } = state;
          const used =
            bill.appliedCouponCode !== null &&
            isOneTimeUse(bill.appliedCouponCode) &&
            !usedCouponCodes.includes(bill.appliedCouponCode)
              ? [...usedCouponCodes, bill.appliedCouponCode]
              : usedCouponCodes;
          set({ lines: [], couponCode: null, usedCouponCodes: used });
          return {
            id: `ORD${Date.now().toString(36).toUpperCase()}`,
            total: bill.grandTotal,
            itemCount: totalQty(state.lines),
          };
        },
      };
    },
    persistOptions<CartState, PersistedCart>({
      name: CART_STORAGE_KEY,
      version: CART_STORAGE_VERSION,
      partialize: ({ lines, couponCode, usedCouponCodes }) => ({
        lines,
        couponCode,
        usedCouponCodes,
      }),
      sanitize: sanitizeCart,
      empty: EMPTY_CART,
    }),
  ),
);
