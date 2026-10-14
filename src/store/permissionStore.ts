import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { persistOptions } from '../persistence/persistOptions';
import { Coords, getCurrentCoords } from '../services/location';
import { checkPermission, requestPermission } from '../services/permissions';
import {
  CheckedStatus,
  PermissionKind,
  PermissionStatus,
  resolveStatus,
} from '../services/permissionStatus';
import { isRecord } from '../utils/guards';

export const PERMISSION_STORAGE_KEY = 'medmax.permissions';

const KINDS: readonly PermissionKind[] = ['location', 'notifications'];

interface PersistedPermissions {
  onboardingDone: boolean;
  /** See `resolveStatus`: Android only reveals "blocked" from a request. */
  blockedHint: Record<PermissionKind, boolean>;
}

export type LocationFetchState = 'idle' | 'loading' | 'error';

interface PermissionState extends PersistedPermissions {
  /** Live OS state: never persisted, re-read on launch and when returning to the app. */
  status: Record<PermissionKind, PermissionStatus>;
  coords: Coords | null;
  locationFetch: LocationFetchState;
  completeOnboarding: () => void;
  refresh: () => Promise<void>;
  request: (kind: PermissionKind) => Promise<void>;
  /** Onboarding: asks for location, then notifications. Never rejects. */
  requestAll: () => Promise<void>;
  fetchLocation: () => Promise<void>;
}

const EMPTY: PersistedPermissions = {
  onboardingDone: false,
  blockedHint: { location: false, notifications: false },
};

export function sanitizePermissions(raw: unknown): PersistedPermissions {
  if (!isRecord(raw)) {
    return EMPTY;
  }
  const hint = isRecord(raw.blockedHint) ? raw.blockedHint : {};
  return {
    onboardingDone: raw.onboardingDone === true,
    blockedHint: {
      location: hint.location === true,
      notifications: hint.notifications === true,
    },
  };
}

export const usePermissionStore = create<PermissionState>()(
  persist<PermissionState, [], [], PersistedPermissions>(
    (set, get) => {
      /** Folds an OS result into state, keeping the blocked hint in sync. */
      const settle = (kind: PermissionKind, checked: CheckedStatus) => {
        const { status, blocked } = resolveStatus(
          checked,
          get().blockedHint[kind],
        );
        set(state => ({
          status: { ...state.status, [kind]: status },
          blockedHint: { ...state.blockedHint, [kind]: blocked },
        }));
      };

      const syncLocation = () => {
        if (get().status.location !== 'granted') {
          set({ coords: null, locationFetch: 'idle' });
          return;
        }
        const { coords, locationFetch } = get();
        if (coords === null && locationFetch !== 'loading') {
          get().fetchLocation();
        }
      };

      return {
        ...EMPTY,
        status: { location: 'unknown', notifications: 'unknown' },
        coords: null,
        locationFetch: 'idle',

        completeOnboarding: () => set({ onboardingDone: true }),

        // Native-module failures must not become unhandled rejections: on error
        // the previous state is kept.
        refresh: async () => {
          try {
            const results = await Promise.all(KINDS.map(checkPermission));
            KINDS.forEach((kind, index) => settle(kind, results[index]));
            syncLocation();
          } catch {
            // keep previous state
          }
        },

        request: async kind => {
          try {
            settle(kind, await requestPermission(kind));
            if (kind === 'location') {
              syncLocation();
            }
          } catch {
            // keep previous state
          }
        },

        requestAll: async () => {
          await get().request('location');
          await get().request('notifications');
        },

        fetchLocation: async () => {
          if (get().locationFetch === 'loading') {
            return;
          }
          set({ locationFetch: 'loading' });
          try {
            const coords = await getCurrentCoords();
            set({ coords, locationFetch: 'idle' });
          } catch {
            set({ locationFetch: 'error' });
          }
        },
      };
    },
    persistOptions<PermissionState, PersistedPermissions>({
      name: PERMISSION_STORAGE_KEY,
      version: 1,
      partialize: ({ onboardingDone, blockedHint }) => ({
        onboardingDone,
        blockedHint,
      }),
      sanitize: sanitizePermissions,
      empty: EMPTY,
    }),
  ),
);
