import { StyleSheet, View } from 'react-native';
import { AppText } from './AppText';
import { colors, radius, spacing } from './theme';

export function RxBadge() {
  return (
    <View
      accessible
      accessibilityLabel="Prescription required"
      style={styles.badge}
    >
      <AppText variant="captionStrong" style={styles.text}>
        Rx
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
    backgroundColor: colors.rxSoft,
    borderWidth: 1,
    borderColor: colors.rx,
  },
  text: { color: colors.rx },
});
