import { StyleSheet, View } from 'react-native';
import { AppText } from '../../ui/AppText';
import { Screen } from '../../ui/Screen';
import { spacing } from '../../ui/theme';

export function OrderPlacedScreen() {
  return (
    <Screen>
      <View style={styles.body}>
        <AppText variant="title">Order placed</AppText>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, padding: spacing.lg },
});
