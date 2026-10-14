import AsyncStorage from '@react-native-async-storage/async-storage';
import { getMedicine } from '../../src/data/catalog';
import { CART_STORAGE_KEY } from '../../src/store/cartPersistence';
import { billOf, useCartStore } from '../../src/store/cartStore';
import { useToastStore } from '../../src/store/toastStore';

const cart = () => useCartStore.getState();
const addTimes = (id: string, times: number) => {
  for (let i = 0; i < times; i++) {
    cart().add(id);
  }
};

beforeEach(async () => {
  await AsyncStorage.clear();
  useCartStore.setState({ lines: [], couponCode: null, usedCouponCodes: [] });
  useToastStore.setState({ toast: null });
});

describe('quantities', () => {
  it('adds, increments, decrements and removes', () => {
    cart().add('m1');
    cart().add('m1');
    cart().add('m5');
    expect(cart().lines).toEqual([
      { id: 'm1', qty: 2 },
      { id: 'm5', qty: 1 },
    ]);
    cart().decrement('m1');
    expect(cart().lines[0]).toEqual({ id: 'm1', qty: 1 });
    cart().decrement('m1');
    expect(cart().lines).toEqual([{ id: 'm5', qty: 1 }]);
    cart().remove('m5');
    expect(cart().lines).toEqual([]);
  });

  it('caps each item at its maxQty', () => {
    expect(getMedicine('m3')?.maxQty).toBe(2); // Azithral
    addTimes('m3', 10);
    expect(cart().lines).toEqual([{ id: 'm3', qty: 2 }]);
    addTimes('m5', 20); // maxQty 10
    expect(cart().lines.find(l => l.id === 'm5')?.qty).toBe(10);
  });

  it('ignores unknown ids', () => {
    cart().add('does-not-exist');
    expect(cart().lines).toEqual([]);
  });
});

describe('applying coupons', () => {
  it('applies an eligible coupon and reflects it in the bill', () => {
    addTimes('m6', 2); // 360
    expect(cart().applyCoupon('FLAT50')).toEqual({ ok: true });
    const bill = billOf(cart());
    expect(bill.discount).toBe(50);
    expect(bill.grandTotal).toBe(360 - 50 + 40);
  });

  it('refuses an ineligible coupon and leaves state alone', () => {
    cart().add('m1'); // 30
    const result = cart().applyCoupon('FLAT50');
    expect(result.ok).toBe(false);
    expect(cart().couponCode).toBeNull();
  });

  it('replaces the previous coupon: only one at a time', () => {
    addTimes('m6', 2);
    cart().applyCoupon('FLAT50');
    cart().applyCoupon('SAVE10');
    expect(cart().couponCode).toBe('SAVE10');
  });

  it('refuses FIRST100 once used', () => {
    useCartStore.setState({ usedCouponCodes: ['FIRST100'] });
    addTimes('m6', 2);
    expect(cart().applyCoupon('FIRST100').ok).toBe(false);
  });
});

describe('auto-removal', () => {
  it('removes a coupon that no longer qualifies and explains why', () => {
    addTimes('m6', 2); // 360
    cart().applyCoupon('FLAT50');
    cart().decrement('m6'); // 180 < 300
    expect(cart().couponCode).toBeNull();
    expect(useToastStore.getState().toast).toMatchObject({
      tone: 'warning',
      message: expect.stringContaining('FLAT50 removed'),
    });
  });

  it('keeps a coupon that still qualifies, with no toast', () => {
    addTimes('m6', 3); // 540
    cart().applyCoupon('FLAT50');
    cart().decrement('m6'); // 360
    expect(cart().couponCode).toBe('FLAT50');
    expect(useToastStore.getState().toast).toBeNull();
  });

  it('removes the coupon when the cart is emptied', () => {
    cart().add('m6');
    cart().applyCoupon('FREEDEL');
    cart().remove('m6');
    expect(cart().couponCode).toBeNull();
    expect(useToastStore.getState().toast?.message).toContain('cart is empty');
  });

  it('does not toast when there was no coupon', () => {
    cart().add('m1');
    cart().remove('m1');
    expect(useToastStore.getState().toast).toBeNull();
  });
});

describe('placeOrder', () => {
  it('returns null for an empty cart', () => {
    expect(cart().placeOrder()).toBeNull();
  });

  it('clears the cart and returns the order summary', () => {
    addTimes('m6', 2); // 360 + 40 fee
    const order = cart().placeOrder();
    expect(order).toMatchObject({ total: 400, itemCount: 2 });
    expect(cart().lines).toEqual([]);
    expect(cart().couponCode).toBeNull();
  });

  it('records FIRST100 as used, atomically with clearing the cart', () => {
    addTimes('m6', 2);
    cart().applyCoupon('FIRST100');
    const order = cart().placeOrder();
    expect(order?.total).toBe(360 - 100 + 40);
    expect(cart().usedCouponCodes).toEqual(['FIRST100']);
    expect(cart().lines).toEqual([]);
    expect(cart().couponCode).toBeNull();

    addTimes('m6', 2);
    expect(cart().applyCoupon('FIRST100').ok).toBe(false);
  });

  it('does not record repeatable coupons as used', () => {
    addTimes('m6', 2);
    cart().applyCoupon('SAVE10');
    cart().placeOrder();
    expect(cart().usedCouponCodes).toEqual([]);
  });

  it('does not record a coupon that was only applied, never ordered', () => {
    addTimes('m6', 2);
    cart().applyCoupon('FIRST100');
    expect(cart().usedCouponCodes).toEqual([]);
  });
});

describe('persistence', () => {
  const persistedCart = async () => {
    const raw = await AsyncStorage.getItem(CART_STORAGE_KEY);
    return raw === null ? null : JSON.parse(raw);
  };

  it('saves a versioned snapshot', async () => {
    addTimes('m1', 2);
    cart().applyCoupon('SAVE10');
    expect(await persistedCart()).toEqual({
      version: 1,
      state: {
        lines: [{ id: 'm1', qty: 2 }],
        couponCode: 'SAVE10',
        usedCouponCodes: [],
      },
    });
  });

  it('restores the cart after a restart', async () => {
    addTimes('m6', 2);
    cart().applyCoupon('FLAT50');
    // Simulate a fresh process: only what is on disk survives.
    const saved = await AsyncStorage.getItem(CART_STORAGE_KEY);
    useCartStore.setState({ lines: [], couponCode: null });
    await AsyncStorage.setItem(CART_STORAGE_KEY, saved ?? '');
    await useCartStore.persist.rehydrate();
    expect(cart().lines).toEqual([{ id: 'm6', qty: 2 }]);
    expect(cart().couponCode).toBe('FLAT50');
    expect(useCartStore.persist.hasHydrated()).toBe(true);
  });

  it.each([
    ['not JSON', '{{{ nope'],
    ['JSON null', 'null'],
    ['a bare number', '42'],
    ['an array', '[]'],
    ['wrong shape', JSON.stringify({ version: 1, state: 'oops' })],
    ['unknown future version', JSON.stringify({ version: 99, state: {} })],
  ])('survives corrupt storage: %s', async (_label, raw) => {
    await AsyncStorage.setItem(CART_STORAGE_KEY, raw);
    await useCartStore.persist.rehydrate();
    expect(cart().lines).toEqual([]);
    expect(cart().couponCode).toBeNull();
    expect(useCartStore.persist.hasHydrated()).toBe(true);
  });

  it('sanitises bad lines: unknown ids, bad qty, duplicates, over maxQty', async () => {
    await AsyncStorage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        state: {
          lines: [
            { id: 'm3', qty: 50 }, // clamp to maxQty 2
            { id: 'ghost', qty: 1 },
            { id: 'm1', qty: 0 },
            { id: 'm1', qty: -3 },
            { id: 'm5', qty: 1.5 },
            { id: 'm5', qty: 'two' },
            { id: 'm2', qty: 1 },
            { id: 'm2', qty: 4 }, // duplicate id
            'junk',
            null,
          ],
          couponCode: 'SAVE10',
          usedCouponCodes: ['FIRST100', 'FIRST100'],
        },
      }),
    );
    await useCartStore.persist.rehydrate();
    expect(cart().lines).toEqual([
      { id: 'm3', qty: 2 },
      { id: 'm2', qty: 1 },
    ]);
    expect(cart().couponCode).toBe('SAVE10');
    expect(cart().usedCouponCodes).toEqual(['FIRST100']);
  });

  it('silently drops a saved coupon that no longer qualifies', async () => {
    await AsyncStorage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        state: {
          lines: [{ id: 'm1', qty: 1 }],
          couponCode: 'FLAT50',
          usedCouponCodes: [],
        },
      }),
    );
    await useCartStore.persist.rehydrate();
    expect(cart().couponCode).toBeNull();
    expect(useToastStore.getState().toast).toBeNull();
  });

  it('drops a saved one-time coupon that was already used', async () => {
    await AsyncStorage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        state: {
          lines: [{ id: 'm6', qty: 3 }],
          couponCode: 'FIRST100',
          usedCouponCodes: ['FIRST100'],
        },
      }),
    );
    await useCartStore.persist.rehydrate();
    expect(cart().couponCode).toBeNull();
  });
});
