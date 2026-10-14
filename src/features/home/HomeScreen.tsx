import { StyleSheet, View } from 'react-native';
import { AppText } from '../../ui/AppText';
import { Screen } from '../../ui/Screen';
import { spacing } from '../../ui/theme';
import { DeliveryLocation } from '../permissions/DeliveryLocation';
import { PermissionBanner } from '../permissions/PermissionBanner';

export function HomeScreen() {
  return (
    <Screen>
      <View style={styles.body}>
        <DeliveryLocation />
        <PermissionBanner />
        <AppText variant="title">Home</AppText>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, padding: spacing.lg, gap: spacing.md },
});
