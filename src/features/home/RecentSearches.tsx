import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '../../ui/AppText';
import { Button } from '../../ui/Button';
import { colors, minTouchTarget, radius, spacing } from '../../ui/theme';

interface Props {
  recents: readonly string[];
  onSelect: (query: string) => void;
  onClear: () => void;
}

export function RecentSearches({ recents, onSelect, onClear }: Props) {
  if (recents.length === 0) {
    return null;
  }
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <AppText variant="heading" accessibilityRole="header">
          Recent searches
        </AppText>
        <Button
          label="Clear"
          variant="ghost"
          accessibilityLabel="Clear recent searches"
          onPress={onClear}
        />
      </View>
      <View style={styles.chips}>
        {recents.map(query => (
          <Pressable
            key={query}
            accessibilityRole="button"
            accessibilityLabel={`Search again for ${query}`}
            onPress={() => onSelect(query)}
            style={styles.chip}
          >
            <AppText>{query}</AppText>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    minHeight: minTouchTarget,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
