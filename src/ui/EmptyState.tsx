import { StyleSheet, View } from 'react-native';
import { AppText } from './AppText';
import { Button } from './Button';
import { spacing } from './theme';

interface Props {
  /** A single emoji used as the illustration. */
  icon: string;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon,
  title,
  message,
  actionLabel,
  onAction,
}: Props) {
  return (
    <View style={styles.container}>
      <AppText
        style={styles.icon}
        accessibilityElementsHidden
        importantForAccessibility="no"
      >
        {icon}
      </AppText>
      <AppText
        variant="heading"
        style={styles.centered}
        accessibilityRole="header"
      >
        {title}
      </AppText>
      <AppText tone="secondary" style={styles.centered}>
        {message}
      </AppText>
      {actionLabel && onAction ? (
        <View style={styles.action}>
          <Button label={actionLabel} onPress={onAction} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
  },
  icon: { fontSize: 48, lineHeight: 56 },
  centered: { textAlign: 'center' },
  action: { marginTop: spacing.md, alignSelf: 'stretch' },
});
