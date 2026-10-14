import { useEffect } from 'react';
import { AccessibilityInfo, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useToastStore } from '../store/toastStore';
import { AppText } from './AppText';
import { colors, elevation, minTouchTarget, radius, spacing } from './theme';

export const TOAST_DURATION_MS = 4000;

/** Mount once at the root. Shows the current toast and dismisses it after a few seconds. */
export function ToastHost() {
  const toast = useToastStore(state => state.toast);
  const hide = useToastStore(state => state.hide);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!toast) {
      return;
    }
    AccessibilityInfo.announceForAccessibility(toast.message);
    const timer = setTimeout(hide, TOAST_DURATION_MS);
    return () => clearTimeout(timer);
  }, [toast, hide]);

  if (!toast) {
    return null;
  }

  return (
    <Pressable
      accessibilityRole="alert"
      accessibilityLabel={toast.message}
      accessibilityHint="Double tap to dismiss"
      onPress={hide}
      style={[
        styles.toast,
        { top: insets.top + spacing.md },
        toast.tone === 'warning' ? styles.warning : styles.info,
      ]}
    >
      <AppText variant="bodyStrong" tone="inverse">
        {toast.message}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    minHeight: minTouchTarget,
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: radius.md,
    ...elevation.sheet,
  },
  info: { backgroundColor: colors.textPrimary },
  warning: { backgroundColor: colors.warning },
});
