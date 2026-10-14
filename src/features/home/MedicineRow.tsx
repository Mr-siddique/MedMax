import { StyleSheet, View } from 'react-native';
import { getQty } from '../../domain/cart';
import { Medicine } from '../../domain/types';
import { useCartStore } from '../../store/cartStore';
import { formatRupees } from '../../utils/money';
import { AppText } from '../../ui/AppText';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { RxBadge } from '../../ui/RxBadge';
import { Stepper } from '../../ui/Stepper';
import { spacing } from '../../ui/theme';

interface Props {
  medicine: Medicine;
  /** Called after the cart changes, so the screen can record the search. */
  onAdded: () => void;
}

export function MedicineRow({ medicine, onAdded }: Props) {
  const qty = useCartStore(state => getQty(state.lines, medicine.id));
  const add = useCartStore(state => state.add);
  const decrement = useCartStore(state => state.decrement);

  const handleAdd = () => {
    add(medicine.id);
    onAdded();
  };

  return (
    <Card style={styles.card}>
      <View style={styles.info}>
        <AppText variant="bodyStrong">{medicine.name}</AppText>
        <AppText variant="caption" tone="secondary">
          {medicine.salt}
        </AppText>
        <View style={styles.meta}>
          <AppText variant="bodyStrong">{formatRupees(medicine.price)}</AppText>
          {medicine.rx ? <RxBadge /> : null}
        </View>
      </View>

      <View style={styles.action}>
        {qty === 0 ? (
          <Button
            label="Add"
            variant="secondary"
            accessibilityLabel={`Add ${medicine.name} to cart`}
            onPress={handleAdd}
          />
        ) : (
          <Stepper
            qty={qty}
            max={medicine.maxQty}
            itemName={medicine.name}
            onIncrement={handleAdd}
            onDecrement={() => decrement(medicine.id)}
          />
        )}
        {qty >= medicine.maxQty ? (
          <AppText variant="captionStrong" tone="secondary">
            Max {medicine.maxQty} per order
          </AppText>
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  info: { flex: 1, gap: spacing.xs },
  meta: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  action: { alignItems: 'flex-end', gap: spacing.xs, minWidth: 96 },
});
