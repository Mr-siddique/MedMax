import { StyleSheet, View } from 'react-native';
import { formatCoords } from '../../services/location';
import { usePermissionStore } from '../../store/permissionStore';
import { AppText } from '../../ui/AppText';
import { Button } from '../../ui/Button';
import { spacing } from '../../ui/theme';

export function DeliveryLocation() {
  const permission = usePermissionStore(state => state.status.location);
  const coords = usePermissionStore(state => state.coords);
  const fetchState = usePermissionStore(state => state.locationFetch);
  const fetchLocation = usePermissionStore(state => state.fetchLocation);

  // `unknown` is the brief moment before the first OS check completes.
  if (permission === 'unknown') {
    return <AppText tone="secondary">Locating you…</AppText>;
  }
  if (permission !== 'granted') {
    return <AppText tone="secondary">Delivering to: location is off</AppText>;
  }
  if (coords) {
    return (
      <AppText variant="bodyStrong">
        Delivering to: {formatCoords(coords)}
      </AppText>
    );
  }
  if (fetchState === 'error') {
    return (
      <View style={styles.row}>
        <AppText tone="danger" style={styles.grow}>
          Couldn’t get your location
        </AppText>
        <Button label="Retry" variant="ghost" onPress={fetchLocation} />
      </View>
    );
  }
  return <AppText tone="secondary">Locating you…</AppText>;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  grow: { flex: 1 },
});
