import { Pressable, StyleSheet, View } from 'react-native';
import { Bill } from '../../domain/bill';
import { getCouponRule } from '../../domain/coupons';
import { useCartStore } from '../../store/cartStore';
import { formatRupees } from '../../utils/money';
import { AppText } from '../../ui/AppText';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { minTouchTarget, spacing } from '../../ui/theme';

interface Props {
  bill: Bill;
  onOpenCoupons: () => void;
}

function savingText(bill: Bill, fallback: string): string {
  if (bill.discount > 0) {
    return `You save ${formatRupees(bill.discount)}`;
  }
  if (bill.deliveryWaivedByCoupon) {
    return 'Delivery fee waived';
  }
  return fallback;
}

export function CouponRow({ bill, onOpenCoupons }: Props) {
  const removeCoupon = useCartStore(state => state.removeCoupon);
  const code = bill.appliedCouponCode;

  if (code === null) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Apply coupon"
        accessibilityHint="Opens the list of available coupons"
        onPress={onOpenCoupons}
      >
        <Card style={styles.row}>
          <AppText style={styles.icon} importantForAccessibility="no">
            🏷️
          </AppText>
          <AppText variant="bodyStrong" style={styles.grow}>
            Apply coupon
          </AppText>
          <AppText tone="brand" variant="heading">
            ›
          </AppText>
        </Card>
      </Pressable>
    );
  }

  const title = getCouponRule(code)?.title ?? '';
  return (
    <Card style={styles.row}>
      <AppText style={styles.icon} importantForAccessibility="no">
        🏷️
      </AppText>
      <View style={styles.grow} accessible>
        <AppText variant="bodyStrong">{`${code} applied`}</AppText>
        <AppText variant="caption" tone="success">
          {savingText(bill, title)}
        </AppText>
      </View>
      <Button
        label="Remove"
        variant="ghost"
        accessibilityLabel={`Remove coupon ${code}`}
        onPress={removeCoupon}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: minTouchTarget,
  },
  icon: { fontSize: 22 },
  grow: { flex: 1 },
});
