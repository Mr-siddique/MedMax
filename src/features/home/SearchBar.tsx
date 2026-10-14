import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { AppText } from '../../ui/AppText';
import {
  colors,
  minTouchTarget,
  radius,
  spacing,
  typography,
} from '../../ui/theme';

interface Props {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  onClear: () => void;
}

export function SearchBar({ value, onChangeText, onSubmit, onClear }: Props) {
  return (
    <View style={styles.container}>
      <TextInput
        accessibilityLabel="Search medicines by name or salt"
        placeholder="Search medicines or salts"
        placeholderTextColor={colors.textSecondary}
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        returnKeyType="search"
        autoCorrect={false}
        autoCapitalize="none"
        style={styles.input}
      />
      {value.length > 0 ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Clear search"
          onPress={onClear}
          style={styles.clear}
        >
          <AppText tone="secondary">✕</AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
  },
  input: {
    ...typography.body,
    flex: 1,
    minHeight: minTouchTarget,
    paddingHorizontal: spacing.md,
    color: colors.textPrimary,
  },
  clear: {
    width: minTouchTarget,
    height: minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
