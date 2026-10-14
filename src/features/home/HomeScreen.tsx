import { StyleSheet, View } from 'react-native';
import { Screen } from '../../ui/Screen';
import { AppText } from '../../ui/AppText';
import { spacing } from '../../ui/theme';

export function HomeScreen() {
  return (
    <Screen>
      <View style={styles.body}>
        <AppText variant="title">Home</AppText>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, padding: spacing.lg },
});
