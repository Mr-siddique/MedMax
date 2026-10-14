import { useNavigation } from '@react-navigation/native';
import { ScrollView, StyleSheet, View } from 'react-native';
import { TabScreenNavigation } from '../../navigation/types';
import { useAddressStore } from '../../store/addressStore';
import { useCartStore } from '../../store/cartStore';
import { useCart } from '../../store/cartSelectors';
import { AppText } from '../../ui/AppText';
import { Card } from '../../ui/Card';
import { EmptyState } from '../../ui/EmptyState';
import { Screen } from '../../ui/Screen';
import { colors, spacing } from '../../ui/theme';
import { AddressRow } from './AddressRow';
import { BillCard } from './BillCard';
import { CartLineRow } from './CartLineRow';
import { CouponRow } from './CouponRow';
import { PlaceOrderBar } from './PlaceOrderBar';

export function CartScreen() {
  const navigation = useNavigation<TabScreenNavigation<'CartTab'>>();
  const { lines, bill } = useCart();
  const hasAddress = useAddressStore(state => state.address !== null);
  const placeOrder = useCartStore(state => state.placeOrder);

  if (lines.length === 0) {
    return (
      <Screen>
        <View style={styles.empty}>
          <EmptyState
            icon="🛒"
            title="Your cart is empty"
            message="Add medicines from the Home tab and they’ll show up here."
            actionLabel="Browse medicines"
            onAction={() => navigation.navigate('HomeTab')}
          />
        </View>
      </Screen>
    );
  }

  const handlePlaceOrder = () => {
    const order = placeOrder();
    if (order) {
      navigation.navigate('OrderPlaced', {
        orderId: order.id,
        total: order.total,
      });
    }
  };

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <AppText variant="title" accessibilityRole="header">
          Your cart
        </AppText>

        {lines.map(line => (
          <CartLineRow key={line.medicine.id} {...line} />
        ))}

        {lines.some(line => line.medicine.rx) ? (
          <Card style={styles.rxNotice}>
            <AppText variant="caption">
              Rx items need a valid prescription. It will be verified at
              delivery, so keep it handy.
            </AppText>
          </Card>
        ) : null}

        <CouponRow
          bill={bill}
          onOpenCoupons={() => navigation.navigate('Coupons')}
        />
        <BillCard bill={bill} />
        <AddressRow onPress={() => navigation.navigate('Address')} />
      </ScrollView>

      <PlaceOrderBar
        grandTotal={bill.grandTotal}
        blockedReason={
          hasAddress ? null : 'Add a delivery address to place your order'
        }
        onPlaceOrder={handlePlaceOrder}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  empty: { flex: 1, justifyContent: 'center' },
  content: { padding: spacing.lg, gap: spacing.md },
  rxNotice: { backgroundColor: colors.warningSoft },
});
