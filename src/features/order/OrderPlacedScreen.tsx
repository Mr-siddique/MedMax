import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect } from 'react';
import { BackHandler, StyleSheet, View } from 'react-native';
import { RootStackParamList } from '../../navigation/types';
import { formatRupees } from '../../utils/money';
import { AppText } from '../../ui/AppText';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { Screen } from '../../ui/Screen';
import { colors, radius, spacing } from '../../ui/theme';

export function OrderPlacedScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { params } = useRoute<RouteProp<RootStackParamList, 'OrderPlaced'>>();

  // Start over from Home so Back never returns to the (now empty) cart.
  const goHome = () =>
    navigation.reset({ index: 0, routes: [{ name: 'Main' }] });

  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        goHome();
        return true;
      },
    );
    return () => subscription.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Screen edges={['top', 'bottom']}>
      <View style={styles.body}>
        <View style={styles.tick} accessibilityElementsHidden>
          <AppText variant="title" tone="inverse">
            ✓
          </AppText>
        </View>
        <AppText variant="title" accessibilityRole="header">
          Order placed!
        </AppText>
        <AppText tone="secondary" style={styles.centered}>
          Your medicines are on the way. This is a demo order, so nothing was
          charged.
        </AppText>

        <Card style={styles.summary}>
          <View
            style={styles.row}
            accessible
            accessibilityLabel={`Order ID ${params.orderId}`}
          >
            <AppText tone="secondary">Order ID</AppText>
            <AppText variant="bodyStrong">{params.orderId}</AppText>
          </View>
          <View
            style={styles.row}
            accessible
            accessibilityLabel={`Amount to pay ${formatRupees(params.total)}`}
          >
            <AppText tone="secondary">Amount to pay</AppText>
            <AppText variant="bodyStrong">{formatRupees(params.total)}</AppText>
          </View>
        </Card>
      </View>
      <View style={styles.actions}>
        <Button label="Back to home" onPress={goHome} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  tick: {
    width: 72,
    height: 72,
    borderRadius: radius.pill,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centered: { textAlign: 'center' },
  summary: { alignSelf: 'stretch', gap: spacing.sm, marginTop: spacing.md },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  actions: { padding: spacing.lg },
});
