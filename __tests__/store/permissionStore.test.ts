import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCurrentCoords } from '../../src/services/location';
import {
  checkPermission,
  requestPermission,
} from '../../src/services/permissions';
import { CheckedStatus } from '../../src/services/permissionStatus';
import {
  PERMISSION_STORAGE_KEY,
  usePermissionStore,
} from '../../src/store/permissionStore';

jest.mock('../../src/services/permissions');
jest.mock('../../src/services/location');

const mockCheck = jest.mocked(checkPermission);
const mockRequest = jest.mocked(requestPermission);
const mockCoords = jest.mocked(getCurrentCoords);

const store = () => usePermissionStore.getState();

/** Makes the fake OS report these statuses for check(). */
function osReports(location: CheckedStatus, notifications: CheckedStatus) {
  mockCheck.mockImplementation(async kind =>
    kind === 'location' ? location : notifications,
  );
}

const here = { latitude: 12.97161, longitude: 77.59461 };

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.resetAllMocks();
  mockCoords.mockResolvedValue(here);
  usePermissionStore.setState({
    onboardingDone: false,
    blockedHint: { location: false, notifications: false },
    status: { location: 'unknown', notifications: 'unknown' },
    coords: null,
    locationFetch: 'idle',
  });
});

describe('refresh', () => {
  it('reads both permissions and fetches the location when granted', async () => {
    osReports('granted', 'denied');
    await store().refresh();
    expect(store().status).toEqual({
      location: 'granted',
      notifications: 'denied',
    });
    await Promise.resolve();
    expect(store().coords).toEqual(here);
  });

  it('does not fetch the location when it is not granted', async () => {
    osReports('denied', 'granted');
    await store().refresh();
    expect(mockCoords).not.toHaveBeenCalled();
    expect(store().coords).toBeNull();
  });

  it('keeps previous state if the native check throws', async () => {
    mockCheck.mockRejectedValue(new Error('native failure'));
    await expect(store().refresh()).resolves.toBeUndefined();
    expect(store().status.location).toBe('unknown');
  });
});

describe('denied vs blocked', () => {
  it('a blocked request result is remembered and sticks across later checks', async () => {
    mockRequest.mockResolvedValue('blocked');
    await store().request('notifications');
    expect(store().status.notifications).toBe('blocked');
    expect(store().blockedHint.notifications).toBe(true);

    // Android's check() can only say "denied" for a blocked permission.
    osReports('denied', 'denied');
    await store().refresh();
    expect(store().status.notifications).toBe('blocked');
  });

  it('a plain denial stays askable', async () => {
    mockRequest.mockResolvedValue('denied');
    await store().request('location');
    expect(store().status.location).toBe('denied');
    expect(store().blockedHint.location).toBe(false);
  });

  it('survives a restart: the hint is persisted, the status is not', async () => {
    mockRequest.mockResolvedValue('blocked');
    await store().request('location');
    const saved = JSON.parse(
      (await AsyncStorage.getItem(PERMISSION_STORAGE_KEY)) ?? 'null',
    );
    expect(saved.state).toEqual({
      onboardingDone: false,
      blockedHint: { location: true, notifications: false },
    });
  });
});

describe('returning from Settings', () => {
  it('reflects a permission the user just granted and clears the block', async () => {
    mockRequest.mockResolvedValue('blocked');
    await store().request('location');
    expect(store().status.location).toBe('blocked');

    osReports('granted', 'denied'); // user flipped the switch in Settings
    await store().refresh();
    expect(store().status.location).toBe('granted');
    expect(store().blockedHint.location).toBe(false);
    await Promise.resolve();
    expect(store().coords).toEqual(here);
  });

  it('reflects a permission the user just revoked and drops the location', async () => {
    osReports('granted', 'granted');
    await store().refresh();
    await Promise.resolve();
    expect(store().coords).toEqual(here);

    osReports('denied', 'granted');
    await store().refresh();
    expect(store().status.location).toBe('denied');
    expect(store().coords).toBeNull();
  });
});

describe('location fetch', () => {
  it('reports an error and recovers on retry', async () => {
    mockCoords.mockRejectedValueOnce(new Error('GPS off'));
    osReports('granted', 'granted');
    await store().refresh();
    await Promise.resolve();
    await Promise.resolve();
    expect(store().locationFetch).toBe('error');
    expect(store().coords).toBeNull();

    await store().fetchLocation();
    expect(store().locationFetch).toBe('idle');
    expect(store().coords).toEqual(here);
  });

  it('never runs two fetches at once', async () => {
    let finish!: () => void;
    mockCoords.mockReturnValue(
      new Promise(resolve => {
        finish = () => resolve(here);
      }),
    );
    const first = store().fetchLocation();
    await store().fetchLocation();
    expect(mockCoords).toHaveBeenCalledTimes(1);
    finish();
    await first;
    expect(store().coords).toEqual(here);
  });
});

describe('requestAll (onboarding)', () => {
  it('asks for location first, then notifications', async () => {
    const order: string[] = [];
    mockRequest.mockImplementation(async kind => {
      order.push(kind);
      return 'granted';
    });
    await store().requestAll();
    expect(order).toEqual(['location', 'notifications']);
  });
});

describe('persistence', () => {
  it('restores onboardingDone and hints, ignoring junk', async () => {
    await AsyncStorage.setItem(
      PERMISSION_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        state: {
          onboardingDone: true,
          blockedHint: { location: true, notifications: 'yes' },
        },
      }),
    );
    await usePermissionStore.persist.rehydrate();
    expect(store().onboardingDone).toBe(true);
    expect(store().blockedHint).toEqual({
      location: true,
      notifications: false,
    });
  });

  it.each([
    ['not JSON', '}{'],
    ['wrong shape', JSON.stringify({ version: 1, state: 5 })],
    ['unknown version', JSON.stringify({ version: 9, state: {} })],
  ])('survives corrupt storage: %s', async (_label, raw) => {
    await AsyncStorage.setItem(PERMISSION_STORAGE_KEY, raw);
    await usePermissionStore.persist.rehydrate();
    expect(store().onboardingDone).toBe(false);
    expect(usePermissionStore.persist.hasHydrated()).toBe(true);
  });
});
