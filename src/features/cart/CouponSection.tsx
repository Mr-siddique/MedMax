import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Bill } from '../../domain/bill';
import {
  CouponStatus,
  getCouponRule,
  listCouponStatuses,
} from '../../domain/coupons';
import { useCartStore } from '../../store/cartStore';
import { formatRupees } from '../../utils/money';
import { animateNextLayout } from '../../ui/animateLayout';
import { AppText } from '../../ui/AppText';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { TextField } from '../../ui/TextField';
import { colors, spacing } from '../../ui/theme';

function savingText(bill: Bill, fallback: string): string {
  if (bill.discount > 0) {
    return `You save ${formatRupees(bill.discount)}`;
  }
  if (bill.deliveryWaivedByCoupon) {
    return 'Delivery fee waived';
  }
  return fallback;
}

function CouponOption({
  coupon,
  onApply,
}: {
  coupon: CouponStatus;
  onApply: () => void;
}) {
  const { eligibility, applied } = coupon;
  return (
    <View style={styles.option}>
      <View style={styles.optionText}>
        <AppText variant="bodyStrong">{coupon.code}</AppText>
        <AppText variant="caption" tone="secondary">
          {coupon.description}
        </AppText>
        {!eligibility.eligible ? (
          <AppText variant="caption" tone="danger">
            {eligibility.reason}
          </AppText>
        ) : null}
      </View>
      <Button
        label={applied ? 'Applied' : 'Apply'}
        variant="secondary"
        accessibilityLabel={
          applied ? `${coupon.code} is applied` : `Apply ${coupon.code}`
        }
        disabled={applied || !eligibility.eligible}
        onPress={onApply}
      />
    </View>
  );
}

/** Coupon code box, the applied coupon, and a collapsible list of all coupons. */
export function CouponSection({ bill }: { bill: Bill }) {
  const applyCoupon = useCartStore(state => state.applyCoupon);
  const removeCoupon = useCartStore(state => state.removeCoupon);
  const usedCouponCodes = useCartStore(state => state.usedCouponCodes);

  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [listOpen, setListOpen] = useState(false);

  const appliedCode = bill.appliedCouponCode;

  const submitCode = () => {
    const result = applyCoupon(code.trim().toUpperCase());
    if (result.ok) {
      setCode('');
      setError(null);
    } else {
      setError(result.reason);
    }
  };

  const applyFromList = (couponCode: string) => {
    if (applyCoupon(couponCode).ok) {
      animateNextLayout();
      setListOpen(false);
      setError(null);
    }
  };

  return (
    <Card style={styles.card}>
      <AppText variant="heading" accessibilityRole="header">
        Coupons
      </AppText>

      {appliedCode !== null ? (
        <View style={styles.applied}>
          <View style={styles.optionText} accessible>
            <AppText variant="bodyStrong">{`${appliedCode} applied`}</AppText>
            <AppText variant="caption" tone="success">
              {savingText(bill, getCouponRule(appliedCode)?.title ?? '')}
            </AppText>
          </View>
          <Button
            label="Remove"
            variant="ghost"
            accessibilityLabel={`Remove coupon ${appliedCode}`}
            onPress={removeCoupon}
          />
        </View>
      ) : (
        <TextField
          label="Have a coupon code?"
          placeholder="Enter code, e.g. FLAT50"
          value={code}
          onChangeText={text => {
            setCode(text);
            setError(null);
          }}
          onSubmitEditing={submitCode}
          error={error ?? undefined}
          autoCapitalize="characters"
          autoCorrect={false}
          returnKeyType="done"
          right={
            <Button
              label="Apply"
              accessibilityLabel="Apply coupon code"
              disabled={code.trim() === ''}
              onPress={submitCode}
            />
          }
        />
      )}

      <Button
        label={listOpen ? 'Hide coupons' : 'View all coupons'}
        variant="ghost"
        onPress={() => {
          animateNextLayout();
          setListOpen(open => !open);
        }}
      />

      {listOpen
        ? listCouponStatuses(bill.itemTotal, usedCouponCodes, appliedCode).map(
            coupon => (
              <CouponOption
                key={coupon.code}
                coupon={coupon}
                onApply={() => applyFromList(coupon.code)}
              />
            ),
          )
        : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.md },
  applied: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: spacing.sm,
    backgroundColor: colors.successSoft,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  optionText: { flex: 1, gap: spacing.xs },
});
