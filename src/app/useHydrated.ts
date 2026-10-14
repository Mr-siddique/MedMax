import { useEffect, useState } from 'react';
import { useAddressStore } from '../store/addressStore';
import { useCartStore } from '../store/cartStore';
import { usePermissionStore } from '../store/permissionStore';
import { useSearchStore } from '../store/searchStore';

/** The slice of zustand's `persist` API this hook needs. */
export interface Hydratable {
  hasHydrated: () => boolean;
  onFinishHydration: (listener: () => void) => () => void;
}

export const persistedStores: readonly Hydratable[] = [
  useCartStore.persist,
  useSearchStore.persist,
  useAddressStore.persist,
  usePermissionStore.persist,
];

/** True once every persisted store has loaded its saved data. */
export function useHydrated(stores: readonly Hydratable[] = persistedStores) {
  const [hydrated, setHydrated] = useState(() =>
    stores.every(store => store.hasHydrated()),
  );

  useEffect(() => {
    const check = () => setHydrated(stores.every(store => store.hasHydrated()));
    const unsubscribes = stores.map(store => store.onFinishHydration(check));
    // A store may have finished between the first render and this effect.
    check();
    return () => unsubscribes.forEach(unsubscribe => unsubscribe());
  }, [stores]);

  return hydrated;
}
