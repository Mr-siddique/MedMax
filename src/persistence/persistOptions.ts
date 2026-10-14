import { PersistOptions } from 'zustand/middleware';
import { createSafeStorage } from './safeStorage';

interface Config<S extends P, P> {
  name: string;
  /** Bump when the saved shape changes. Saves of any other version are discarded (reset to `empty`). */
  version: number;
  /** What goes to disk. */
  partialize: (state: S) => P;
  /** Turns anything read from disk into a valid P. Must never throw. */
  sanitize: (raw: unknown) => P;
  /** Used when the saved version is unknown. */
  empty: P;
}

/**
 * Shared persist options so every store gets the same guarantees: safe storage,
 * a version, and a sanitiser between disk and state.
 */
export function persistOptions<S extends P, P>(
  config: Config<S, P>,
): PersistOptions<S, P> {
  return {
    name: config.name,
    version: config.version,
    storage: createSafeStorage<P>(),
    partialize: config.partialize,
    migrate: (persisted, version) =>
      version === config.version ? config.sanitize(persisted) : config.empty,
    merge: (persisted, current) => ({
      ...current,
      ...config.sanitize(persisted),
    }),
  };
}
