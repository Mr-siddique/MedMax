import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { usePermissionStore } from '../../store/permissionStore';
import { AppText } from '../../ui/AppText';
import { Button } from '../../ui/Button';
import { Screen } from '../../ui/Screen';
import { spacing } from '../../ui/theme';

const REASONS = [
  {
    icon: '📍',
    title: 'Location',
    text: 'So we can show delivery availability for where you are.',
  },
  {
    icon: '🔔',
    title: 'Notifications',
    text: 'So we can tell you when your order is on its way.',
  },
];

export function OnboardingScreen() {
  const requestAll = usePermissionStore(state => state.requestAll);
  const completeOnboarding = usePermissionStore(s => s.completeOnboarding);
  const [asking, setAsking] = useState(false);

  const allow = async () => {
    setAsking(true);
    await requestAll();
    completeOnboarding();
  };

  return (
    <Screen>
      <View style={styles.body}>
        <AppText variant="title" accessibilityRole="header">
          Medicines in minutes
        </AppText>
        <AppText tone="secondary">
          Two quick permissions make MedMax work best. You can change them any
          time in Settings.
        </AppText>

        {REASONS.map(reason => (
          <View key={reason.title} style={styles.reason} accessible>
            <AppText style={styles.icon} importantForAccessibility="no">
              {reason.icon}
            </AppText>
            <View style={styles.reasonText}>
              <AppText variant="bodyStrong">{reason.title}</AppText>
              <AppText tone="secondary">{reason.text}</AppText>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.actions}>
        <Button label="Allow permissions" loading={asking} onPress={allow} />
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
  reason: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  icon: { fontSize: 28 },
  reasonText: { flex: 1 },
  actions: { padding: spacing.lg, gap: spacing.sm },
});
