import { StyleSheet, View } from 'react-native';
import { ResolvedLine } from '../../domain/types';
import { useCartStore } from '../../store/cartStore';
import { formatRupees } from '../../utils/money';
import { AppText } from '../../ui/AppText';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { RxBadge } from '../../ui/RxBadge';
import { Stepper } from '../../ui/Stepper';
import { spacing } from '../../ui/theme';

export function CartLineRow({ medicine, qty }: ResolvedLine) {
  const add = useCartStore(state => state.add);
  const decrement = useCartStore(state => state.decrement);
  const remove = useCartStore(state => state.remove);

  return (
    <Card style={styles.card}>
      <View style={styles.top}>
        <View style={styles.info}>
          <AppText variant="bodyStrong">{medicine.name}</AppText>
          <AppText variant="caption" tone="secondary">
            {medicine.salt}
          </AppText>
          {medicine.rx ? <RxBadge /> : null}
        </View>
        <View
          accessible
          accessibilityLabel={`${formatRupees(
            medicine.price,
          )} each, ${formatRupees(medicine.price * qty)} total`}
          style={styles.prices}
        >
          <AppText variant="bodyStrong">
            {formatRupees(medicine.price * qty)}
          </AppText>
          <AppText variant="caption" tone="secondary">
            {formatRupees(medicine.price)} each
          </AppText>
        </View>
      </View>

      <View style={styles.bottom}>
        <Button
          label="Remove"
          variant="ghost"
          accessibilityLabel={`Remove all ${medicine.name}`}
          onPress={() => remove(medicine.id)}
        />
        <View style={styles.stepper}>
          <Stepper
            qty={qty}
            max={medicine.maxQty}
            itemName={medicine.name}
            onIncrement={() => add(medicine.id)}
            onDecrement={() => decrement(medicine.id)}
          />
          {qty >= medicine.maxQty ? (
            <AppText variant="captionStrong" tone="secondary">
              Max {medicine.maxQty} per order
            </AppText>
          ) : null}
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.md },
  top: { flexDirection: 'row', gap: spacing.md },
  info: { flex: 1, gap: spacing.xs },
  prices: { alignItems: 'flex-end' },
  bottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepper: { alignItems: 'flex-end', gap: spacing.xs },
});
