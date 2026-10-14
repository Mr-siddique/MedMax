import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { validateAddress } from '../domain/address';
import { Address } from '../domain/types';
import { persistOptions } from '../persistence/persistOptions';
import { isRecord } from '../utils/guards';

interface PersistedAddress {
  address: Address | null;
}

interface AddressState extends PersistedAddress {
  saveAddress: (address: Address) => void;
  clearAddress: () => void;
}

const EMPTY: PersistedAddress = { address: null };

/** Saved data goes through the same validation as the form. */
export function sanitizeAddress(raw: unknown): PersistedAddress {
  if (!isRecord(raw) || !isRecord(raw.address)) {
    return EMPTY;
  }
  const { name, phone, line1, pincode } = raw.address;
  if (
    typeof name !== 'string' ||
    typeof phone !== 'string' ||
    typeof line1 !== 'string' ||
    typeof pincode !== 'string'
  ) {
    return EMPTY;
  }
  const result = validateAddress({ name, phone, line1, pincode });
  return result.valid ? { address: result.address } : EMPTY;
}

export const ADDRESS_STORAGE_KEY = 'medmax.address';

export const useAddressStore = create<AddressState>()(
  persist<AddressState, [], [], PersistedAddress>(
    set => ({
      ...EMPTY,
      saveAddress: address => set({ address }),
      clearAddress: () => set({ address: null }),
    }),
    persistOptions<AddressState, PersistedAddress>({
      name: ADDRESS_STORAGE_KEY,
      version: 1,
      partialize: ({ address }) => ({ address }),
      sanitize: sanitizeAddress,
      empty: EMPTY,
    }),
  ),
);
