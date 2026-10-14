import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from './AppText';
import { colors, minTouchTarget, radius, spacing } from './theme';

interface Props {
  qty: number;
  max: number;
  /** Used in screen-reader labels, e.g. "Increase quantity of Dolo 650". */
  itemName: string;
  onIncrement: () => void;
  onDecrement: () => void;
}

export function Stepper({
  qty,
  max,
  itemName,
  onIncrement,
  onDecrement,
}: Props) {
  const atMax = qty >= max;
  return (
    <View style={styles.container}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          qty <= 1
            ? `Remove ${itemName} from cart`
            : `Decrease quantity of ${itemName}`
        }
        onPress={onDecrement}
        style={styles.button}
      >
        <AppText variant="heading" tone="brand">
          −
        </AppText>
      </Pressable>
      <AppText
        variant="bodyStrong"
        style={styles.qty}
        accessibilityLabel={`${qty} in cart`}
        accessibilityLiveRegion="polite"
      >
        {qty}
      </AppText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          atMax
            ? `Maximum quantity of ${max} reached for ${itemName}`
            : `Increase quantity of ${itemName}`
        }
        accessibilityState={{ disabled: atMax }}
        disabled={atMax}
        onPress={onIncrement}
        style={styles.button}
      >
        <AppText variant="heading" tone={atMax ? 'secondary' : 'brand'}>
          +
        </AppText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.brand,
    borderRadius: radius.md,
    backgroundColor: colors.brandSoft,
  },
  button: {
    width: minTouchTarget,
    height: minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qty: { minWidth: spacing.xl, textAlign: 'center' },
});
