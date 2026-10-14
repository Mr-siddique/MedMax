import { act, fireEvent, render, screen } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import App from '../App';
import { persistedStores } from '../src/app/useHydrated';
import { useCartStore } from '../src/store/cartStore';
import { usePermissionStore } from '../src/store/permissionStore';

async function waitForHydration() {
  await act(async () => {
    await Promise.all([
      useCartStore.persist.rehydrate(),
      usePermissionStore.persist.rehydrate(),
    ]);
  });
  expect(persistedStores.every(s => s.hasHydrated())).toBe(true);
}

beforeEach(async () => {
  await AsyncStorage.clear();
  useCartStore.setState({ lines: [], couponCode: null, usedCouponCodes: [] });
  usePermissionStore.setState({ onboardingDone: false });
});

describe('App shell', () => {
  it('shows onboarding first, then the Home tab once skipped', async () => {
    await render(<App />);
    await waitForHydration();

    expect(screen.getByText('Medicines in minutes')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Not now' }));

    expect(screen.getByLabelText('Home, search medicines')).toBeTruthy();
    expect(screen.queryByText('Medicines in minutes')).toBeNull();
  });

  it('skips onboarding when it was already completed', async () => {
    usePermissionStore.setState({ onboardingDone: true });
    await render(<App />);
    await waitForHydration();
    expect(screen.queryByText('Medicines in minutes')).toBeNull();
    expect(screen.getByLabelText('Home, search medicines')).toBeTruthy();
  });

  it('shows the cart quantity on the Cart tab', async () => {
    usePermissionStore.setState({ onboardingDone: true });
    await render(<App />);
    await waitForHydration();

    expect(screen.getByLabelText('Cart, empty')).toBeTruthy();
    await act(async () => {
      useCartStore.getState().add('m1');
      useCartStore.getState().add('m1');
      useCartStore.getState().add('m5');
    });
    expect(screen.getByLabelText('Cart, 3 items')).toBeTruthy();
  });
});
