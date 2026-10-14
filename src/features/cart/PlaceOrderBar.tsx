import { StyleSheet, View } from 'react-native';
import { Address } from '../../domain/types';
import { formatRupees } from '../../utils/money';
import { AppText } from '../../ui/AppText';
import { Button } from '../../ui/Button';
import { colors, elevation, spacing } from '../../ui/theme';

interface Props {
  grandTotal: number;
  /** The saved delivery address, shown as a one-line summary with a way to change it. */
  address: Address | null;
  /** Why ordering is not possible yet; shown above the button. */
  blockedReason: string | null;
  onPlaceOrder: () => void;
  onChangeAddress: () => void;
}

/** Pinned to the bottom of the Cart tab so the total and the main action are always in reach. */
export function PlaceOrderBar({
  grandTotal,
  address,
  blockedReason,
  onPlaceOrder,
  onChangeAddress,
}: Props) {
  return (
    <View style={styles.bar}>
      {address ? (
        <View style={styles.address}>
          <View
            accessible
            accessibilityLabel={`Delivering to ${address.name}, ${address.pincode}`}
            style={styles.addressText}
          >
            <AppText variant="caption" tone="secondary" numberOfLines={1}>
              {`Delivering to ${address.name}, ${address.pincode}`}
            </AppText>
          </View>
          <Button
            label="Change"
            variant="ghost"
            accessibilityLabel="Change delivery address"
            onPress={onChangeAddress}
          />
        </View>
      ) : null}
      {blockedReason ? (
        <AppText variant="caption" tone="danger">
          {blockedReason}
        </AppText>
      ) : null}
      <View style={styles.row}>
        <View
          accessible
          accessibilityLabel={`Grand total ${formatRupees(grandTotal)}`}
        >
          <AppText variant="caption" tone="secondary">
            Grand total
          </AppText>
          <AppText variant="title">{formatRupees(grandTotal)}</AppText>
        </View>
        <View style={styles.button}>
          <Button
            label="Place order"
            disabled={blockedReason !== null}
            onPress={onPlaceOrder}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    padding: spacing.lg,
    gap: spacing.sm,
    backgroundColor: colors.surface,
    ...elevation.sheet,
  },
  address: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  addressText: { flex: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.lg,
  },
  button: { flex: 1 },
});
