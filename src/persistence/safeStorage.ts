import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJSONStorage, StateStorage } from 'zustand/middleware';

/**
 * zustand's persist leaves `hasHydrated()` false forever if storage throws,
 * which would pin the app on its splash screen. So this layer never throws:
 * unreadable or non-JSON data reads as "nothing saved", failed writes are dropped.
 */
const safeStateStorage: StateStorage = {
  async getItem(name) {
    try {
      const value = await AsyncStorage.getItem(name);
      if (value === null) {
        return null;
      }
      JSON.parse(value);
      return value;
    } catch {
      return null;
    }
  },
  async setItem(name, value) {
    try {
      await AsyncStorage.setItem(name, value);
    } catch {
      // A failed write only loses persistence for this session.
    }
  },
  async removeItem(name) {
    try {
      await AsyncStorage.removeItem(name);
    } catch {
      // Nothing useful to do.
    }
  },
};

export function createSafeStorage<S>() {
  return createJSONStorage<S>(() => safeStateStorage);
}
