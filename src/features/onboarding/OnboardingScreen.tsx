import { StyleSheet, View } from 'react-native';
import { usePermissionStore } from '../../store/permissionStore';
import { AppText } from '../../ui/AppText';
import { Button } from '../../ui/Button';
import { Screen } from '../../ui/Screen';
import { spacing } from '../../ui/theme';

export function OnboardingScreen() {
  const completeOnboarding = usePermissionStore(s => s.completeOnboarding);
  return (
    <Screen>
      <View style={styles.body}>
        <AppText variant="title">Welcome to MedMax</AppText>
        <Button label="Continue" onPress={completeOnboarding} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.lg,
    justifyContent: 'center',
  },
});
