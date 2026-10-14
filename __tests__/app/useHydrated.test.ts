import { act, renderHook } from '@testing-library/react-native';
import { Hydratable, useHydrated } from '../../src/app/useHydrated';

function fakeStore(initial: boolean) {
  let done = initial;
  const listeners = new Set<() => void>();
  const store: Hydratable = {
    hasHydrated: () => done,
    onFinishHydration: listener => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
  return {
    store,
    finish: () => {
      done = true;
      listeners.forEach(listener => listener());
    },
    listenerCount: () => listeners.size,
  };
}

describe('useHydrated', () => {
  it('is true immediately when every store is already hydrated', async () => {
    const stores = [fakeStore(true).store, fakeStore(true).store];
    const { result } = await renderHook(() => useHydrated(stores));
    expect(result.current).toBe(true);
  });

  it('waits for the slowest store', async () => {
    const a = fakeStore(false);
    const b = fakeStore(false);
    const stores = [a.store, b.store];
    const { result } = await renderHook(() => useHydrated(stores));
    expect(result.current).toBe(false);

    await act(async () => a.finish());
    expect(result.current).toBe(false);

    await act(async () => b.finish());
    expect(result.current).toBe(true);
  });

  it('unsubscribes on unmount', async () => {
    const a = fakeStore(false);
    const stores = [a.store];
    const { unmount } = await renderHook(() => useHydrated(stores));
    expect(a.listenerCount()).toBe(1);
    await unmount();
    expect(a.listenerCount()).toBe(0);
  });
});
