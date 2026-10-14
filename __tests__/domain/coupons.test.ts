import {
  evaluateCoupon,
  isOneTimeUse,
  listCouponStatuses,
} from '../../src/domain/coupons';

describe('evaluateCoupon', () => {
  it('returns the effect for an eligible coupon', () => {
    expect(evaluateCoupon('FLAT50', 300, [])).toEqual({
      ok: true,
      effect: { discount: 50, waiveDelivery: false },
    });
  });

  it('returns a reason for an ineligible one', () => {
    expect(evaluateCoupon('FLAT50', 100, [])).toEqual({
      ok: false,
      reason: expect.stringContaining('₹200 more'),
    });
  });

  it('only treats FIRST100 as one-time use', () => {
    expect(isOneTimeUse('FIRST100')).toBe(true);
    expect(isOneTimeUse('FLAT50')).toBe(false);
    expect(isOneTimeUse('UNKNOWN')).toBe(false);
  });

  it('does not block a repeatable coupon that appears in the used list', () => {
    expect(evaluateCoupon('SAVE10', 500, ['SAVE10']).ok).toBe(true);
  });
});

describe('listCouponStatuses', () => {
  it('lists all four coupons in order', () => {
    const codes = listCouponStatuses(0, [], null).map(s => s.code);
    expect(codes).toEqual(['FLAT50', 'SAVE10', 'FREEDEL', 'FIRST100']);
  });

  it('marks eligibility, the applied coupon and used coupons', () => {
    const byCode = Object.fromEntries(
      listCouponStatuses(250, ['FIRST100'], 'SAVE10').map(s => [s.code, s]),
    );
    expect(byCode.FLAT50.eligibility.eligible).toBe(false);
    expect(byCode.SAVE10).toMatchObject({
      applied: true,
      eligibility: { eligible: true },
    });
    expect(byCode.FREEDEL.applied).toBe(false);
    expect(byCode.FIRST100.eligibility).toEqual({
      eligible: false,
      reason: 'You have already used this coupon',
    });
  });
});
