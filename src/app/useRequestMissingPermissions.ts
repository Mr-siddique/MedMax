import { useEffect } from 'react';
import { usePermissionStore } from '../store/permissionStore';

/**
 * Once per launch, after saved data has loaded, asks again for any permission
 * the user has not granted. First launch is left to onboarding, which asks
 * itself; permissions the OS has blocked get the Open Settings card instead.
 */
export function useRequestMissingPermissions(hydrated: boolean) {
  useEffect(() => {
    if (hydrated && usePermissionStore.getState().onboardingDone) {
      usePermissionStore.getState().requestMissing();
    }
  }, [hydrated]);
}
