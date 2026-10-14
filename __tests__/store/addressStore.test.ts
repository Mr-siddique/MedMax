import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ADDRESS_STORAGE_KEY,
  useAddressStore,
} from '../../src/store/addressStore';

const address = {
  name: 'Aamir Rahman',
  phone: '9876543210',
  line1: '12, MG Road, Indiranagar',
  pincode: '560038',
};

beforeEach(async () => {
  await AsyncStorage.clear();
  useAddressStore.setState({ address: null });
});

describe('addressStore', () => {
  it('saves and clears an address', () => {
    useAddressStore.getState().saveAddress(address);
    expect(useAddressStore.getState().address).toEqual(address);
    useAddressStore.getState().clearAddress();
    expect(useAddressStore.getState().address).toBeNull();
  });

  it('restores a saved address', async () => {
    await AsyncStorage.setItem(
      ADDRESS_STORAGE_KEY,
      JSON.stringify({ version: 1, state: { address } }),
    );
    await useAddressStore.persist.rehydrate();
    expect(useAddressStore.getState().address).toEqual(address);
  });

  it.each([
    ['not JSON', 'oops{'],
    ['wrong shape', JSON.stringify({ version: 1, state: { address: 'x' } })],
    [
      'invalid phone',
      JSON.stringify({
        version: 1,
        state: { address: { ...address, phone: '1' } },
      }),
    ],
    [
      'non-string field',
      JSON.stringify({
        version: 1,
        state: { address: { ...address, pincode: 560038 } },
      }),
    ],
    ['unknown version', JSON.stringify({ version: 7, state: { address } })],
  ])('survives corrupt storage: %s', async (_label, raw) => {
    await AsyncStorage.setItem(ADDRESS_STORAGE_KEY, raw);
    await useAddressStore.persist.rehydrate();
    expect(useAddressStore.getState().address).toBeNull();
    expect(useAddressStore.persist.hasHydrated()).toBe(true);
  });
});
