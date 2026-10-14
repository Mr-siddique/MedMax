import {
  computeBill,
  computeItemTotal,
  deliveryFeeFor,
} from '../../src/domain/bill';
import { ResolvedLine } from '../../src/domain/types';

/** A single line costing exactly `total` rupees. */
const cartOf = (total: number): ResolvedLine[] =>
  total === 0
    ? []
    : [
        {
          medicine: {
            id: 'x',
            name: 'X',
            salt: 'S',
            price: total,
            maxQty: 99,
            rx: false,
          },
          qty: 1,
        },
      ];

describe('delivery fee', () => {
  it.each([
    [1, 40],
    [498, 40],
    [499, 0],
    [500, 0],
    [0, 0],
  ])('item total %d -> fee %d', (total, fee) => {
    expect(deliveryFeeFor(total)).toBe(fee);
    expect(computeBill(cartOf(total), null, []).deliveryFee).toBe(fee);
  });

  it('reports how much more is needed for free delivery', () => {
    expect(computeBill(cartOf(450), null, []).amountToFreeDelivery).toBe(49);
    expect(computeBill(cartOf(499), null, []).amountToFreeDelivery).toBe(0);
    expect(computeBill(cartOf(0), null, []).amountToFreeDelivery).toBe(0);
  });
});

describe('bill without coupon', () => {
  it('sums price x qty across lines', () => {
    const lines: ResolvedLine[] = [
      { ...cartOf(30)[0], qty: 2 },
      { ...cartOf(45)[0], qty: 1 },
    ];
    expect(computeItemTotal(lines)).toBe(105);
  });

  it('adds the fee below the threshold', () => {
    const bill = computeBill(cartOf(100), null, []);
    expect(bill).toMatchObject({
      itemTotal: 100,
      discount: 0,
      deliveryFee: 40,
      grandTotal: 140,
      appliedCouponCode: null,
      couponRejection: null,
    });
  });

  it('is all zeros for an empty cart', () => {
    expect(computeBill([], null, [])).toMatchObject({
      itemTotal: 0,
      discount: 0,
      deliveryFee: 0,
      grandTotal: 0,
    });
  });
});

describe('FLAT50', () => {
  it('rejects below ₹300', () => {
    const bill = computeBill(cartOf(299), 'FLAT50', []);
    expect(bill.discount).toBe(0);
    expect(bill.appliedCouponCode).toBeNull();
    expect(bill.couponRejection).toMatch(/Add ₹1 more/);
    expect(bill.grandTotal).toBe(299 + 40);
  });

  it('gives ₹50 off at exactly ₹300', () => {
    const bill = computeBill(cartOf(300), 'FLAT50', []);
    expect(bill).toMatchObject({
      discount: 50,
      appliedCouponCode: 'FLAT50',
      deliveryFee: 40,
      grandTotal: 300 - 50 + 40,
    });
  });
});

describe('SAVE10', () => {
  it.each([
    [100, 10],
    [255, 25],
    [999, 99],
    [1000, 100],
  ])('item total %d -> discount %d', (total, discount) => {
    expect(computeBill(cartOf(total), 'SAVE10', []).discount).toBe(discount);
  });

  it('caps the discount at ₹100', () => {
    const bill = computeBill(cartOf(5000), 'SAVE10', []);
    expect(bill.discount).toBe(100);
    expect(bill.grandTotal).toBe(4900);
  });
});

describe('FREEDEL', () => {
  it('waives the fee below the threshold', () => {
    const bill = computeBill(cartOf(100), 'FREEDEL', []);
    expect(bill).toMatchObject({
      discount: 0,
      deliveryFee: 0,
      deliveryWaivedByCoupon: true,
      grandTotal: 100,
    });
  });

  it('stays applied but saves nothing when delivery is already free', () => {
    const bill = computeBill(cartOf(600), 'FREEDEL', []);
    expect(bill).toMatchObject({
      appliedCouponCode: 'FREEDEL',
      deliveryFee: 0,
      deliveryWaivedByCoupon: false,
      grandTotal: 600,
    });
  });
});

describe('FIRST100', () => {
  it('rejects below ₹200', () => {
    const bill = computeBill(cartOf(199), 'FIRST100', []);
    expect(bill.appliedCouponCode).toBeNull();
    expect(bill.couponRejection).toMatch(/minimum ₹200/);
  });

  it('gives ₹100 off at exactly ₹200', () => {
    const bill = computeBill(cartOf(200), 'FIRST100', []);
    expect(bill).toMatchObject({
      discount: 100,
      deliveryFee: 40,
      grandTotal: 200 - 100 + 40,
    });
  });

  it('is rejected once it has been used', () => {
    const bill = computeBill(cartOf(500), 'FIRST100', ['FIRST100']);
    expect(bill.appliedCouponCode).toBeNull();
    expect(bill.discount).toBe(0);
    expect(bill.couponRejection).toMatch(/already used/);
  });

  it('is unaffected by other coupons having been used', () => {
    const bill = computeBill(cartOf(500), 'FIRST100', ['FLAT50']);
    expect(bill.discount).toBe(100);
  });
});

describe('coupon edge cases', () => {
  it('rejects an unknown code', () => {
    const bill = computeBill(cartOf(500), 'NOPE', []);
    expect(bill.couponRejection).toMatch(/not valid/);
    expect(bill.grandTotal).toBe(500);
  });

  it('rejects every coupon on an empty cart', () => {
    for (const code of ['FLAT50', 'SAVE10', 'FREEDEL', 'FIRST100']) {
      const bill = computeBill([], code, []);
      expect(bill.couponRejection).toBe('Your cart is empty');
      expect(bill.grandTotal).toBe(0);
    }
  });

  it('never discounts more than the item total or goes negative', () => {
    for (const code of ['FLAT50', 'SAVE10', 'FREEDEL', 'FIRST100']) {
      for (let total = 0; total <= 2000; total++) {
        const bill = computeBill(cartOf(total), code, []);
        expect(bill.discount).toBeLessThanOrEqual(bill.itemTotal);
        expect(bill.grandTotal).toBeGreaterThanOrEqual(0);
      }
    }
  });
});
