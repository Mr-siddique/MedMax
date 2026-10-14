import { Platform } from 'react-native';
import {
  checkMultiple,
  checkNotifications,
  openSettings,
  PERMISSIONS,
  requestMultiple,
  requestNotifications,
} from 'react-native-permissions';
import {
  CheckedStatus,
  combineLocationStatuses,
  normalizeStatus,
  PermissionKind,
} from './permissionStatus';

const LOCATION_PERMISSIONS =
  Platform.OS === 'ios'
    ? [PERMISSIONS.IOS.LOCATION_WHEN_IN_USE]
    : [
        PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
        PERMISSIONS.ANDROID.ACCESS_COARSE_LOCATION,
      ];

export async function checkPermission(
  kind: PermissionKind,
): Promise<CheckedStatus> {
  if (kind === 'notifications') {
    const { status } = await checkNotifications();
    return normalizeStatus(status);
  }
  const results = await checkMultiple(LOCATION_PERMISSIONS);
  return combineLocationStatuses(Object.values(results));
}

/** Shows the system dialog when the OS still allows it. */
export async function requestPermission(
  kind: PermissionKind,
): Promise<CheckedStatus> {
  if (kind === 'notifications') {
    const { status } = await requestNotifications();
    return normalizeStatus(status);
  }
  const results = await requestMultiple(LOCATION_PERMISSIONS);
  return combineLocationStatuses(Object.values(results));
}

/** Deep-links to this app's page in the system Settings. */
export async function openAppSettings(): Promise<void> {
  try {
    await openSettings('application');
  } catch {
    // Nothing more we can do if the Settings app cannot be opened.
  }
}
