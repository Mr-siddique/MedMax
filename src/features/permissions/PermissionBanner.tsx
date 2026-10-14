import { StyleSheet, View } from 'react-native';
import { openAppSettings } from '../../services/permissions';
import { PermissionKind } from '../../services/permissionStatus';
import { usePermissionStore } from '../../store/permissionStore';
import { AppText } from '../../ui/AppText';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { colors, radius, spacing } from '../../ui/theme';

const NAME: Record<PermissionKind, string> = {
  location: 'Location',
  notifications: 'Notifications',
};

const WHY: Record<PermissionKind, string> = {
  location: 'to show delivery availability near you',
  notifications: 'to send you order updates',
};

/** Rationale + the right action for a permission that is not granted. */
function PermissionPrompt({ kind }: { kind: PermissionKind }) {
  const status = usePermissionStore(state => state.status[kind]);
  const request = usePermissionStore(state => state.request);

  if (status === 'denied') {
    return (
      <Card style={styles.prompt}>
        <AppText>
          Allow {NAME[kind].toLowerCase()} {WHY[kind]}.
        </AppText>
        <Button
          label={`Allow ${NAME[kind].toLowerCase()}`}
          variant="secondary"
          onPress={() => request(kind)}
        />
      </Card>
    );
  }
  if (status === 'blocked') {
    return (
      <Card style={styles.prompt}>
        <AppText>
          {NAME[kind]} is turned off for MedMax. Turn it on in Settings{' '}
          {WHY[kind]}.
        </AppText>
        <Button
          label="Open Settings"
          variant="secondary"
          accessibilityHint={`Opens the app settings so you can allow ${NAME[
            kind
          ].toLowerCase()}`}
          onPress={openAppSettings}
        />
      </Card>
    );
  }
  return null;
}

/** Small debug line (required by the brief): the current state of both permissions. */
export function PermissionStatusLine() {
  const location = usePermissionStore(state => state.status.location);
  const notifications = usePermissionStore(state => state.status.notifications);

  return (
    <View
      accessible
      accessibilityLabel={`Permissions. Location ${location}. Notifications ${notifications}.`}
      style={styles.debug}
    >
      <AppText variant="caption" tone="secondary">
        Permissions · Location: {location} · Notifications: {notifications}
      </AppText>
    </View>
  );
}

/** A rationale card with the right action for each permission that is not granted. */
export function PermissionPrompts() {
  return (
    <View style={styles.prompts}>
      <PermissionPrompt kind="location" />
      <PermissionPrompt kind="notifications" />
    </View>
  );
}

const styles = StyleSheet.create({
  prompts: { gap: spacing.sm },
  debug: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
  },
  prompt: { gap: spacing.md },
});
