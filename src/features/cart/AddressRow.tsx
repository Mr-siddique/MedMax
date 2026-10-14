import { Pressable, StyleSheet, View } from 'react-native';
import { useAddressStore } from '../../store/addressStore';
import { AppText } from '../../ui/AppText';
import { Card } from '../../ui/Card';
import { minTouchTarget, spacing } from '../../ui/theme';

export function AddressRow({ onPress }: { onPress: () => void }) {
  const address = useAddressStore(state => state.address);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        address
          ? `Delivery address: ${address.name}, ${address.line1}, ${address.pincode}. Change`
          : 'Add delivery address'
      }
      onPress={onPress}
    >
      <Card style={styles.row}>
        <AppText style={styles.icon} importantForAccessibility="no">
          📍
        </AppText>
        <View style={styles.grow}>
          {address ? (
            <>
              <AppText variant="bodyStrong">{`Deliver to ${address.name}`}</AppText>
              <AppText variant="caption" tone="secondary">
                {`${address.line1}, ${address.pincode}`}
              </AppText>
              <AppText variant="caption" tone="secondary">
                {address.phone}
              </AppText>
            </>
          ) : (
            <>
              <AppText variant="bodyStrong">Add delivery address</AppText>
              <AppText variant="caption" tone="secondary">
                We need an address to deliver your order
              </AppText>
            </>
          )}
        </View>
        <AppText tone="brand" variant="bodyStrong">
          {address ? 'Change' : 'Add'}
        </AppText>
      </Card>
    </Pressable>
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
