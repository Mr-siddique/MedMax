import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { AppState, AppStateStatus } from 'react-native';
import { usePermissionSync } from '../../src/app/usePermissionSync';
import { DeliveryLocation } from '../../src/features/permissions/DeliveryLocation';
import {
  PermissionPrompts,
  PermissionStatusLine,
} from '../../src/features/permissions/PermissionBanner';
import { OnboardingScreen } from '../../src/features/onboarding/OnboardingScreen';
import { openAppSettings } from '../../src/services/permissions';
import { usePermissionStore } from '../../src/store/permissionStore';

jest.mock('../../src/services/permissions');
jest.mock('../../src/services/location', () => ({
  ...jest.requireActual('../../src/services/location'),
  getCurrentCoords: jest.fn(),
}));

const setStatus = (
  location: 'granted' | 'denied' | 'blocked' | 'unavailable' | 'unknown',
  notifications: 'granted' | 'denied' | 'blocked' | 'unavailable' | 'unknown',
) => usePermissionStore.setState({ status: { location, notifications } });

beforeEach(() => {
  jest.clearAllMocks();
  usePermissionStore.setState({
    onboardingDone: false,
    status: { location: 'unknown', notifications: 'unknown' },
    coords: null,
    locationFetch: 'idle',
  });
});

const PermissionBanner = () => (
  <>
    <PermissionStatusLine />
    <PermissionPrompts />
  </>
);

describe('permission banner', () => {
  it('always shows the debug status line', async () => {
    setStatus('granted', 'denied');
    await render(<PermissionBanner />);
    expect(
      screen.getByText(
        'Permissions · Location: granted · Notifications: denied',
      ),
    ).toBeTruthy();
  });

  it('shows no prompts when everything is granted', async () => {
    setStatus('granted', 'granted');
    await render(<PermissionBanner />);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('offers to ask again when denied', async () => {
    const request = jest.fn().mockResolvedValue(undefined);
    usePermissionStore.setState({ request });
    setStatus('denied', 'granted');
    await render(<PermissionBanner />);
    await fireEvent.press(
      screen.getByRole('button', { name: 'Allow location' }),
    );
    expect(request).toHaveBeenCalledWith('location');
  });

  it('explains a blocked permission and deep-links to Settings', async () => {
    setStatus('granted', 'blocked');
    await render(<PermissionBanner />);
    expect(screen.getByText(/Notifications is turned off/)).toBeTruthy();
    await fireEvent.press(
      screen.getByRole('button', { name: 'Open Settings' }),
    );
    expect(openAppSettings).toHaveBeenCalledTimes(1);
  });

  it('updates when the status changes (e.g. back from Settings)', async () => {
    setStatus('blocked', 'granted');
    await render(<PermissionBanner />);
    expect(screen.getByRole('button', { name: 'Open Settings' })).toBeTruthy();
    await act(async () => setStatus('granted', 'granted'));
    expect(screen.queryByRole('button')).toBeNull();
  });
});

describe('DeliveryLocation', () => {
  it('shows coordinates once known', async () => {
    setStatus('granted', 'granted');
    usePermissionStore.setState({
      coords: { latitude: 12.97161, longitude: 77.59461 },
    });
    await render(<DeliveryLocation />);
    expect(screen.getByText('Delivering to: 12.9716,77.5946')).toBeTruthy();
  });

  it('does not claim location is off before the first check finishes', async () => {
    setStatus('unknown', 'unknown');
    await render(<DeliveryLocation />);
    expect(screen.queryByText(/location is off/)).toBeNull();
    expect(screen.getByText('Locating you…')).toBeTruthy();
  });

  it('says so when location is off', async () => {
    setStatus('blocked', 'granted');
    await render(<DeliveryLocation />);
    expect(screen.getByText('Delivering to: location is off')).toBeTruthy();
  });

  it('shows a locating state, then an error with retry', async () => {
    setStatus('granted', 'granted');
    await render(<DeliveryLocation />);
    expect(screen.getByText('Locating you…')).toBeTruthy();

    const fetchLocation = jest.fn().mockResolvedValue(undefined);
    await act(async () =>
      usePermissionStore.setState({ locationFetch: 'error', fetchLocation }),
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Retry' }));
    expect(fetchLocation).toHaveBeenCalledTimes(1);
  });
});

describe('OnboardingScreen', () => {
  it('requests permissions then completes onboarding', async () => {
    const requestAll = jest.fn().mockResolvedValue(undefined);
    usePermissionStore.setState({ requestAll });
    await render(<OnboardingScreen />);
    await fireEvent.press(
      screen.getByRole('button', { name: 'Allow permissions' }),
    );
    expect(requestAll).toHaveBeenCalledTimes(1);
    expect(usePermissionStore.getState().onboardingDone).toBe(true);
  });

  it('"Not now" skips without asking', async () => {
    const requestAll = jest.fn();
    usePermissionStore.setState({ requestAll });
    await render(<OnboardingScreen />);
    await fireEvent.press(screen.getByRole('button', { name: 'Not now' }));
    expect(requestAll).not.toHaveBeenCalled();
    expect(usePermissionStore.getState().onboardingDone).toBe(true);
  });
});

describe('usePermissionSync', () => {
  function Probe() {
    usePermissionSync();
    return null;
  }

  it('refreshes on mount and each time the app returns to the foreground', async () => {
    const refresh = jest.fn().mockResolvedValue(undefined);
    usePermissionStore.setState({ refresh });
    let listener: (state: AppStateStatus) => void = () => undefined;
    const remove = jest.fn();
    jest.spyOn(AppState, 'addEventListener').mockImplementation((_t, cb) => {
      listener = cb;
      return { remove };
    });

    const { unmount } = await render(<Probe />);
    expect(refresh).toHaveBeenCalledTimes(1);

    listener('background');
    expect(refresh).toHaveBeenCalledTimes(1);
    listener('active');
    expect(refresh).toHaveBeenCalledTimes(2);

    await unmount();
    expect(remove).toHaveBeenCalled();
  });
});
