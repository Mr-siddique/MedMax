import type { PermissionStatus as LibraryStatus } from 'react-native-permissions';

export type PermissionKind = 'location' | 'notifications';

/** What the OS reports. */
export type CheckedStatus = 'granted' | 'denied' | 'blocked' | 'unavailable';

/** What the app knows: `unknown` until the first check completes. */
export type PermissionStatus = CheckedStatus | 'unknown';

export function normalizeStatus(status: LibraryStatus): CheckedStatus {
  switch (status) {
    case 'granted':
    case 'limited':
      return 'granted';
    case 'blocked':
      return 'blocked';
    case 'unavailable':
      return 'unavailable';
    default:
      return 'denied';
  }
}

/**
 * Location is requested as fine + coarse so the user can pick "approximate":
 * either one granted is enough. Otherwise it is only blocked if all are.
 */
export function combineLocationStatuses(
  statuses: readonly LibraryStatus[],
): CheckedStatus {
  const normalized = statuses.map(normalizeStatus);
  if (normalized.some(s => s === 'granted')) {
    return 'granted';
  }
  if (normalized.length > 0 && normalized.every(s => s === 'blocked')) {
    return 'blocked';
  }
  if (normalized.every(s => s === 'unavailable')) {
    return 'unavailable';
  }
  return 'denied';
}

/**
 * On Android only `request()` can tell "blocked" (don't ask again) from
 * "denied"; `check()` reports both as denied. We remember a blocked result
 * (`wasBlocked`) and treat a later denied check as still blocked. A granted
 * check proves the user fixed it in Settings.
 */
export function resolveStatus(
  checked: CheckedStatus,
  wasBlocked: boolean,
): { status: CheckedStatus; blocked: boolean } {
  if (checked === 'granted' || checked === 'unavailable') {
    return { status: checked, blocked: false };
  }
  if (checked === 'blocked' || wasBlocked) {
    return { status: 'blocked', blocked: true };
  }
  return { status: 'denied', blocked: false };
}
