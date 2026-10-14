import { useNavigation } from '@react-navigation/native';
import { ComponentRef, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { TabScreenNavigation } from '../../navigation/types';
import { useAddressStore } from '../../store/addressStore';
import { useCartStore } from '../../store/cartStore';
import { useCart } from '../../store/cartSelectors';
import { useKeyboardVisible } from '../../utils/useKeyboardVisible';
import { AppText } from '../../ui/AppText';
import { Card } from '../../ui/Card';
import { EmptyState } from '../../ui/EmptyState';
import { Screen } from '../../ui/Screen';
import { colors, spacing } from '../../ui/theme';
import { AddressSection } from './AddressSection';
import { BillCard } from './BillCard';
import { CartLineRow } from './CartLineRow';
import { CouponSection } from './CouponSection';
import { PlaceOrderBar } from './PlaceOrderBar';

export function CartScreen() {
  const navigation = useNavigation<TabScreenNavigation<'CartTab'>>();
  const { lines, bill } = useCart();
  const address = useAddressStore(state => state.address);
  const [changingAddress, setChangingAddress] = useState(false);
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const placeOrder = useCartStore(state => state.placeOrder);
  const keyboardVisible = useKeyboardVisible();

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

  const handleChangeAddress = () => {
    setChangingAddress(true);
    // The form lives at the top of the list.
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  const blockedReason =
    address === null
      ? 'Add a delivery address to place your order'
      : changingAddress
      ? 'Save or cancel your address changes first'
      : null;

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
      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <AppText variant="title" accessibilityRole="header">
            Your cart
          </AppText>

          <AddressSection
            editing={changingAddress}
            onDone={() => setChangingAddress(false)}
          />

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

          <CouponSection bill={bill} />
          <BillCard bill={bill} />
        </ScrollView>

        {/* Hidden while typing so the form gets the room; it returns when the keyboard closes. */}
        {keyboardVisible ? null : (
          <PlaceOrderBar
            grandTotal={bill.grandTotal}
            address={address}
            blockedReason={blockedReason}
            onPlaceOrder={handlePlaceOrder}
            onChangeAddress={handleChangeAddress}
          />
        )}
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  empty: { flex: 1, justifyContent: 'center' },
  content: { padding: spacing.lg, gap: spacing.md },
  rxNotice: { backgroundColor: colors.warningSoft },
});
