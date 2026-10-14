import { ComponentRef, ReactNode, Ref } from 'react';
import { StyleSheet, TextInput, TextInputProps, View } from 'react-native';
import { AppText } from './AppText';
import { colors, minTouchTarget, radius, spacing, typography } from './theme';

interface Props extends Omit<TextInputProps, 'style'> {
  label: string;
  error?: string;
  /** Rendered beside the input, e.g. an Apply button. */
  right?: ReactNode;
  /** Lets a form move focus to the next field on the keyboard's Next key. */
  inputRef?: Ref<ComponentRef<typeof TextInput>>;
}

export function TextField({
  label,
  error,
  right,
  inputRef,
  ...inputProps
}: Props) {
  return (
    <View style={styles.container}>
      <AppText variant="captionStrong" tone="secondary">
        {label}
      </AppText>
      <View style={styles.row}>
        <TextInput
          ref={inputRef}
          accessibilityLabel={label}
          placeholderTextColor={colors.textSecondary}
          style={[styles.input, error ? styles.inputError : null]}
          {...inputProps}
        />
        {right}
      </View>
      {error ? (
        <AppText
          variant="caption"
          tone="danger"
          accessibilityLiveRegion="polite"
        >
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  input: {
    ...typography.body,
    flex: 1,
    minHeight: minTouchTarget,
    paddingHorizontal: spacing.md,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
  },
  inputError: { borderColor: colors.danger },
});
