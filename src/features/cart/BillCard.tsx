import { StyleSheet, View } from 'react-native';
import { Bill } from '../../domain/bill';
import { formatRupees } from '../../utils/money';
import { AppText } from '../../ui/AppText';
import { Card } from '../../ui/Card';
import { colors, spacing } from '../../ui/theme';

interface RowProps {
  label: string;
  value: string;
  tone?: 'primary' | 'success';
  strong?: boolean;
}

function BillRow({ label, value, tone = 'primary', strong = false }: RowProps) {
  const variant = strong ? 'heading' : 'body';
  return (
    <View
      accessible
      accessibilityLabel={`${label}, ${value}`}
      style={styles.row}
    >
      <AppText variant={variant}>{label}</AppText>
      <AppText variant={variant} tone={tone}>
        {value}
      </AppText>
    </View>
  );
}

export function BillCard({ bill }: { bill: Bill }) {
  return (
    <Card style={styles.card}>
      <AppText variant="heading" accessibilityRole="header">
        Bill details
      </AppText>
      <BillRow label="Item total" value={formatRupees(bill.itemTotal)} />
      <BillRow
        label="Discount"
        value={
          bill.discount > 0
            ? `-${formatRupees(bill.discount)}`
            : formatRupees(0)
        }
        tone={bill.discount > 0 ? 'success' : 'primary'}
      />
      <BillRow
        label="Delivery fee"
        value={bill.deliveryFee > 0 ? formatRupees(bill.deliveryFee) : 'Free'}
        tone={bill.deliveryFee > 0 ? 'primary' : 'success'}
      />
      {bill.deliveryFee > 0 ? (
        <AppText variant="caption" tone="brand">
          {`Add ${formatRupees(
            bill.amountToFreeDelivery,
          )} more for free delivery`}
        </AppText>
      ) : null}
      <View style={styles.divider} />
      <BillRow
        label="Grand total"
        value={formatRupees(bill.grandTotal)}
        strong
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },
});
