import { StyleSheet, View } from 'react-native';
import { Card } from '../../ui/Card';
import { colors, radius, spacing } from '../../ui/theme';

const ROWS = [0, 1, 2];

/** Placeholder rows shown while a search is in flight. */
export function SearchSkeleton() {
  return (
    <View
      accessible
      accessibilityLabel="Searching medicines"
      accessibilityLiveRegion="polite"
      style={styles.container}
    >
      {ROWS.map(row => (
        <Card key={row} style={styles.card}>
          <View style={styles.lines}>
            <View style={[styles.bar, styles.title]} />
            <View style={[styles.bar, styles.subtitle]} />
          </View>
          <View style={[styles.bar, styles.button]} />
        </Card>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.md },
  card: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  lines: { flex: 1, gap: spacing.sm },
  bar: { backgroundColor: colors.border, borderRadius: radius.sm },
  title: { height: 16, width: '60%' },
  subtitle: { height: 12, width: '40%' },
  button: { height: 40, width: 80 },
});
