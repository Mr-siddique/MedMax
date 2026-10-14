import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { persistOptions } from '../persistence/persistOptions';
import { isRecord } from '../utils/guards';

export const PERMISSION_STORAGE_KEY = 'medmax.permissions';

interface PersistedPermissions {
  onboardingDone: boolean;
}

interface PermissionState extends PersistedPermissions {
  completeOnboarding: () => void;
}

const EMPTY: PersistedPermissions = { onboardingDone: false };

export function sanitizePermissions(raw: unknown): PersistedPermissions {
  return isRecord(raw) && raw.onboardingDone === true
    ? { onboardingDone: true }
    : EMPTY;
}

export const usePermissionStore = create<PermissionState>()(
  persist<PermissionState, [], [], PersistedPermissions>(
    set => ({
      ...EMPTY,
      completeOnboarding: () => set({ onboardingDone: true }),
    }),
    persistOptions<PermissionState, PersistedPermissions>({
      name: PERMISSION_STORAGE_KEY,
      version: 1,
      partialize: ({ onboardingDone }) => ({ onboardingDone }),
      sanitize: sanitizePermissions,
      empty: EMPTY,
    }),
  ),
);
