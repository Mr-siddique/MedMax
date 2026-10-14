import { useEffect } from 'react';
import { AppState } from 'react-native';
import { usePermissionStore } from '../store/permissionStore';

/**
 * Re-reads permission state on launch and whenever the app returns to the
 * foreground, so changes made in system Settings show up immediately.
 */
export function usePermissionSync() {
  const refresh = usePermissionStore(state => state.refresh);

  useEffect(() => {
    refresh();
    const subscription = AppState.addEventListener('change', next => {
      if (next === 'active') {
        refresh();
      }
    });
    return () => subscription.remove();
  }, [refresh]);
}
